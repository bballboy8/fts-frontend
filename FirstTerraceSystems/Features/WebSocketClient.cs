﻿using System.Net.WebSockets;
using System.Text;
using FirstTerraceSystems.Models;
using System.Text.Json;

namespace FirstTerraceSystems.Features
{
    public static class WebSocketClient
    {
        static ClientWebSocket _webSocket = new();

        public delegate void OnRealDataReceived(NasdaqResponse? nasdaqData);

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
                    if (_webSocket.State != WebSocketState.Open)
                    {
#if DEBUG
                        await _webSocket.ConnectAsync(new Uri("ws://localhost:6969/ws"), CancellationToken.None);
                        //await _webSocket.ConnectAsync(new Uri("ws://52.0.33.126:8000/nasdaq/get_real_data"), CancellationToken.None);
#else
                        await _webSocket.ConnectAsync(new Uri("ws://52.0.33.126:8000/nasdaq/get_real_data"), CancellationToken.None);
#endif
                        var buffer = Encoding.UTF8.GetBytes("start");
                        await _webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                        connectionTrial = 0;
                    }

                    while (_webSocket.State == WebSocketState.Connecting)
                    {
                        await Task.Delay(50); // Small delay to avoid busy waiting
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    connectionTrial++;
                    await ConnectAsync();
                }
            }

        }

        public static async Task CloseAsync()
        {
            if (_webSocket.State == WebSocketState.Open || _webSocket.State == WebSocketState.CloseSent || _webSocket.State == WebSocketState.CloseReceived)
            {
                await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None);
                _webSocket.Dispose();
            }
            else if (_webSocket.State == WebSocketState.Connecting)
            {
                Console.WriteLine("WebSocket is still connecting. Aborting connection.");
                _webSocket.Abort();
            }
        }

        public async static Task ListenAsync()
        {
            var buffer = new byte[1024];

            using (var memoryStream = new MemoryStream())
            {
                try
                {
                    while (_webSocket.State == WebSocketState.Open)
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                            await memoryStream.WriteAsync(buffer, 0, result.Count);
                        } while (!result.EndOfMessage);

                        memoryStream.Seek(0, SeekOrigin.Begin);
                        var message = Encoding.UTF8.GetString(memoryStream.ToArray());

                        if (result.MessageType == WebSocketMessageType.Text && !message.Contains("start"))
                        {
                            ProcessMessage(message);
                        }

                        memoryStream.SetLength(0);
                    }
                }
                catch (WebSocketException ex)
                {
                    Console.WriteLine($"WebSocket error: {ex.Message}");
                    await ConnectAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Unexpected error: {ex.Message}");
                }
            }
        }

        static void ProcessMessage(string message)
        {
            try
            {
                var data = JsonSerializer.Deserialize<NasdaqResponse>(message);
                ActionRealDataReceived?.Invoke(data);
                ActionReferenceChart?.Invoke();
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"JSON deserialization error: {ex.Message}");
            }
        }
    }
}