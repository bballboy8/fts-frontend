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

        public delegate void OnRealDataReceived(NasdaqResponse? response);

        public delegate Task ReferenceChartAsync();

        public static event OnRealDataReceived? ActionRealDataReceived;

        public static event ReferenceChartAsync? ActionReferenceChart;

        public async static Task ConnectAsync()
        {

            int connectionTrial = 0;

            if (connectionTrial < 3)
            {
                try
                {
                    _webSocket = new ClientWebSocket();
                    await _webSocket.ConnectAsync(new Uri($"{ApiEndpoints.WebSocketUri}/nasdaq/get_real_data"), CancellationToken.None);
                    var buffer = Encoding.UTF8.GetBytes("start");
                    await _webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                    connectionTrial = 0;

                    while (_webSocket.State == WebSocketState.Connecting)
                    {
                        await Task.Delay(50); // Small delay to avoid busy waiting
                    }
                }
                catch (Exception ex)
                {
                    Log.Error($"WebSocket connection error: {ex.Message}");
                    connectionTrial++;
                    Log.Information($"Retry to connect WebSocket: {connectionTrial}");
                    await ConnectAsync();
                }
            }

        }

        public static async Task CloseAsync()
        {
            try
            {
                if (_webSocket.State == WebSocketState.Open || _webSocket.State == WebSocketState.CloseSent || _webSocket.State == WebSocketState.CloseReceived)
                {
                    await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None);
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
        }

        public async static Task ListenAsync()
        {
            byte[] buffer = new byte[1024 * 10];

            bool isStarted = false;
            try
            {
                while (_webSocket.State == WebSocketState.Open)
                {
                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                            memoryStream.Write(buffer, 0, result.Count);
                        } while (!result.EndOfMessage);

                        if (result.MessageType == WebSocketMessageType.Text)
                        {
                            memoryStream.Seek(0, SeekOrigin.Begin);

                            if (!isStarted)
                            {
                                isStarted = IsStarted(memoryStream);
                            }
                            else
                            {
                                ProcessMessage(memoryStream);
                            }
                        }
                    }
                }
            }
            catch (WebSocketException ex)
            {
                Log.Error($"WebSocket error: {ex.Message}");
                Log.Information($"Reconnecting WebSocket");
                await ConnectAsync();
                Log.Information($"Reconnected WebSocket");
                Log.Information($"Listening WebSocket");
                await ListenAsync();
            }
            catch (Exception ex)
            {
                Log.Error($"Unexpected error: {ex.Message}");
            }
            isStarted = false;
        }

        static bool IsStarted(MemoryStream memoryStream)
        {
            using (StreamReader reader = new StreamReader(memoryStream, Encoding.UTF8))
            {
                string? message = reader.ReadToEnd();
                memoryStream.SetLength(0);
                return message.Contains("start");
            }
        }

        static void ProcessMessage(MemoryStream memoryStream)
        {
            try
            {
                NasdaqResponse? response = JsonSerializer.Deserialize<NasdaqResponse>(memoryStream);
                Log.Information($"Real Data Received: {response?.Data.Length}");
                if (response?.Data.Length > 0)
                {
                    ActionRealDataReceived?.Invoke(response);
                    ActionReferenceChart?.Invoke();
                }
            }
            catch (Exception ex)
            {
                Log.Error($"ProcessMessage error: {ex.Message}");
            }
            finally
            {
                memoryStream.SetLength(0);
            }
        }
    }
}