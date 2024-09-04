using System.Net.WebSockets;
using System.Text;
using FirstTerraceSystems.Models;
using System.Text.Json;
using Serilog;

namespace FirstTerraceSystems.Features
{
    public static class WebSocketClient
    {
        static ClientWebSocket _webSocket = new();
        static ClientWebSocket _webSocketCta = new();
        public delegate Task OnRealDataReceived(NasdaqResponse? response);

        public delegate Task ReferenceChartAsync(NasdaqResponse? response);

        public static event OnRealDataReceived? ActionRealDataReceived;

        public static event ReferenceChartAsync? ActionReferenceChart;


        public static async Task ConnectUtp()
        {

            int connectionTrial = 0;

            if (connectionTrial < 3)
            {
                try
                {
                    _webSocket = new ClientWebSocket();
                    await _webSocket.ConnectAsync(new Uri($"{ApiEndpoints.WebSocketUri}/nasdaq/get_real_data_utp"), CancellationToken.None).ConfigureAwait(false);
                    connectionTrial = 0;
                    while (_webSocket.State == WebSocketState.Connecting)
                    {
                        await Task.Delay(50).ConfigureAwait(false); // Small delay to avoid busy waiting
                    }
                    await _webSocket.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes("start")), WebSocketMessageType.Text, true, CancellationToken.None).ConfigureAwait(false);

                }
                catch (Exception ex)
                {
                    Log.Error($"WebSocket connection error: {ex.Message}");
                    connectionTrial++;
                    Log.Information($"Retry to connect WebSocket: {connectionTrial}");
                    await ConnectUtp().ConfigureAwait(false);
                }
            }
        }

        public static async Task ConnectCta()
        {
            int connectionTrial = 0;

            if (connectionTrial < 3)
            {
                try
                {
                    _webSocketCta = new ClientWebSocket();
                    await _webSocketCta.ConnectAsync(new Uri($"{ApiEndpoints.WebSocketUri}/nasdaq/get_real_data_cta"), CancellationToken.None).ConfigureAwait(false);
                    connectionTrial = 0;
                    while (_webSocketCta.State == WebSocketState.Connecting)
                    {
                        await Task.Delay(50); // Small delay to avoid busy waiting
                    }
                    var buffer = Encoding.UTF8.GetBytes("start");
                    await _webSocketCta.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    Log.Error($"WebSocket connection error: {ex.Message}");
                    connectionTrial++;
                    Log.Information($"Retry to connect WebSocket: {connectionTrial}");
                    await ConnectCta().ConfigureAwait(false);
                }
            }
        }

        public static Task CloseUtp()
        {
            Task.Run(async () =>
            {
                try
                {
                    if (_webSocket.State == WebSocketState.Open || _webSocket.State == WebSocketState.CloseSent || _webSocket.State == WebSocketState.CloseReceived)
                    {
                        await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None).ConfigureAwait(false);
                        _webSocket.Dispose();
                        Log.Information("WebSocket Close");
                    }
                    else if (_webSocket.State == WebSocketState.Connecting)
                    {
                        _webSocket.Abort();
                        Log.Information("WebSocket is still connecting. Aborting connection.");
                    }
                }
                catch (Exception ex)
                {
                    Log.Error($"WebSocket close error: {ex.Message}");
                }
            });

            return Task.CompletedTask;
        }

        public static async Task CloseCta()
        {
            try
            {
                if (_webSocketCta.State == WebSocketState.Open || _webSocketCta.State == WebSocketState.CloseSent || _webSocketCta.State == WebSocketState.CloseReceived)
                {
                    await _webSocketCta.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None);
                    _webSocketCta.Dispose();
                    Log.Information("WebSocket Close");
                }
                else if (_webSocketCta.State == WebSocketState.Connecting)
                {
                    _webSocketCta.Abort();
                    Log.Information("WebSocket is still connecting. Aborting connection.");
                }
            }
            catch (Exception ex)
            {
                Log.Error($"WebSocket close error: {ex.Message}");
            }
        }


        public static Task ListenUtp()
        {
            Task.Run(async () =>
            {
                byte[] buffer = new byte[1024 * 10];
                try
                {
                    StringBuilder messageBuilder = new();
                    while (_webSocket.State == WebSocketState.Open)
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None).ConfigureAwait(false);

                            if (result.MessageType == WebSocketMessageType.Text)
                            {
                                messageBuilder.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
                            }

                            // Handle other message types if necessary
                        } while (!result.EndOfMessage);

                        if (messageBuilder.Length > 0)
                        {
                            ProcessMessage(messageBuilder.ToString()).ConfigureAwait(false);
                            messageBuilder.Clear();
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log.Error($"WebSocket error: {ex.Message}");
                    Log.Information($"Reconnecting WebSocket");
                    await ConnectUtp();
                    Log.Information($"Reconnected WebSocket");
                    Log.Information($"Listening WebSocket");
                    await ListenUtp(); // Restart listening on reconnection
                }
            });
            return Task.CompletedTask;
        }

        public static Task ListenCta()
        {
            Task.Run(async () =>
            {
                byte[] buffer = new byte[1024 * 10];
                try
                {
                    StringBuilder messageBuilder = new();
                    while (_webSocketCta.State == WebSocketState.Open)
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await _webSocketCta.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None).ConfigureAwait(false);
                            if (result.MessageType == WebSocketMessageType.Text)
                            {
                                messageBuilder.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
                            }
                            // Handle other message types if necessary
                        } while (!result.EndOfMessage);
                        if (messageBuilder.Length > 0)
                        {
                            ProcessMessage(messageBuilder.ToString()).ConfigureAwait(false);
                            messageBuilder.Clear();
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log.Error($"WebSocket error: {ex.Message}");
                    Log.Information($"Reconnecting WebSocket");
                    await ConnectCta().ConfigureAwait(false);
                    Log.Information($"Reconnected WebSocket");
                    Log.Information($"Listening WebSocket");
                    await ListenCta().ConfigureAwait(false); // Restart listening on reconnection
                }
            });
            return Task.CompletedTask;
        }

        static Task ProcessMessage(string message)
        {
            Task.Run(() =>
            {
                try
                {
                    if (message.Contains("start")) return;

                    NasdaqResponse? response = JsonSerializer.Deserialize<NasdaqResponse>(message);
                    Log.Information($"Real Data Received: {response?.Data.Length}");
                    if (response?.Data.Length > 0)
                    {
                        ActionReferenceChart?.Invoke(response);
                        ActionRealDataReceived?.Invoke(response);
                    }
                }
                catch (Exception ex)
                {
                    Log.Error($"ProcessMessage error: {ex.Message}");
                }

            });
            return Task.CompletedTask;
        }
    }
}