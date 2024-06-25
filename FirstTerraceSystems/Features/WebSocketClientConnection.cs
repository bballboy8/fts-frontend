using Microsoft.AspNetCore.Components;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using FirstTerraceSystems.Models;
using System.Threading.Tasks;
using System.Threading;
using System;
using System.IO;
using FirstTerraceSystems.Repositories;
using Microsoft.JSInterop;
using System.Text.Json;

namespace FirstTerraceSystems.Features
{
    public static class WebSocketClient
    {
        static ClientWebSocket _websocket = new ClientWebSocket();

        static int _connectionTrial = 0;

        public delegate void OnRealDataReceived(NasdaqResponse? nasdaqData);

        public delegate Task ReferenceChartAsync();

        public static event OnRealDataReceived? ActionRealDataReceived;

        public static event ReferenceChartAsync? ActionReferenceChart;

        public async static Task ConnectAsync()
        {
            if (_connectionTrial < 3)
            {
                try
                {
                    //ws://localhost:6969/ws test socket url
                    //await _websocket.ConnectAsync(new Uri("ws://52.0.33.126:8000/nasdaq/get_real_data"), CancellationToken.None);
                    await _websocket.ConnectAsync(new Uri("ws://localhost:6969/ws"), CancellationToken.None);
                    var buffer = Encoding.UTF8.GetBytes("start");
                    await _websocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                    _connectionTrial = 0;
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    _connectionTrial++;
                    await ConnectAsync();
                }
            }

        }

        public static async Task CloseAsync()
        {
            if (_websocket.State == WebSocketState.Open)
            {
                await _websocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None);
                _websocket.Dispose();
            }
        }

        public async static Task ListenAsync()
        {
            var buffer = new byte[1024 * 4];

            using (var memoryStream = new MemoryStream())
            {
                try
                {
                    while (_websocket.State == WebSocketState.Open)
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await _websocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
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