﻿using System.Net.WebSockets;
using System.Text;
using FirstTerraceSystems.Models;
using System.Text.Json;
using Serilog;

namespace FirstTerraceSystems.Features
{
    public static class WebSocketClient
    {
        static ClientWebSocket _webSocket = new();
    static ClientWebSocket _webSocketcta = new();
    public delegate Task OnRealDataReceived(NasdaqResponse? response);

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
                    await _webSocket.ConnectAsync(new Uri($"{ApiEndpoints.WebSocketUri}/nasdaq/get_real_data_utp"), CancellationToken.None);
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

    public async static Task ConnectctaAsync()
    {

      int connectionTrial = 0;

      if (connectionTrial < 3)
      {
        try
        {
          _webSocketcta = new ClientWebSocket();
          await _webSocketcta.ConnectAsync(new Uri($"{ApiEndpoints.WebSocketUri}/nasdaq/get_real_data_cta"), CancellationToken.None);
          var buffer = Encoding.UTF8.GetBytes("start");
          await _webSocketcta.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
          connectionTrial = 0;
          while (_webSocketcta.State == WebSocketState.Connecting)
          {
            await Task.Delay(50); // Small delay to avoid busy waiting
          }
        }
        catch (Exception ex)
        {
          Log.Error($"WebSocket connection error: {ex.Message}");
          connectionTrial++;
          Log.Information($"Retry to connect WebSocket: {connectionTrial}");
          await ConnectctaAsync();
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

    public static async Task ClosectaAsync()
    {
      try
      {
        if (_webSocketcta.State == WebSocketState.Open || _webSocketcta.State == WebSocketState.CloseSent || _webSocketcta.State == WebSocketState.CloseReceived)
        {
          await _webSocketcta.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None);
          _webSocketcta.Dispose();
          Log.Information("WebSocket Close");
        }
        else if (_webSocketcta.State == WebSocketState.Connecting)
        {
          _webSocketcta.Abort();
          Log.Information("WebSocket is still connecting. Aborting connection.");
        }
      }
      catch (Exception ex)
      {
        Log.Error($"WebSocket close error: {ex.Message}");
      }
    }

    public static async Task ListenAsync()
    {
        byte[] buffer = new byte[1024 * 10];

        bool isStarted = false;
        try
        {
          while (_webSocket.State == WebSocketState.Open)
          {
            WebSocketReceiveResult result;
            StringBuilder messageBuilder = new StringBuilder();

            do
            {
              result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

              if (result.MessageType == WebSocketMessageType.Text)
              {
                string messagePart = Encoding.UTF8.GetString(buffer, 0, result.Count);
                messageBuilder.Append(messagePart);
              }
              // Handle other message types if necessary
            } while (!result.EndOfMessage);

            if (messageBuilder.Length > 0)
            {
              string message = messageBuilder.ToString();
              ProcessMessage(message);

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
          ListenAsync(); // Restart listening on reconnection
        }
        catch (Exception ex)
        {
          Log.Error($"Unexpected error: {ex.Message}");
        }
        finally
        {
          isStarted = false;
        }
    }

    public static async Task ListenctaAsync()
    {
      byte[] buffer = new byte[1024 * 10];

        bool isStarted = false;
        try
        {
          while (_webSocketcta.State == WebSocketState.Open)
          {
            WebSocketReceiveResult result;
            StringBuilder messageBuilder = new StringBuilder();

            do
            {
              result = await _webSocketcta.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

              if (result.MessageType == WebSocketMessageType.Text)
              {
                string messagePart = Encoding.UTF8.GetString(buffer, 0, result.Count);
                messageBuilder.Append(messagePart);
              }
              // Handle other message types if necessary
            } while (!result.EndOfMessage);

            if (messageBuilder.Length > 0)
            {
              string message = messageBuilder.ToString();
              ProcessMessage(message);

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
          ListenAsync(); // Restart listening on reconnection
        }
        catch (Exception ex)
        {
          Log.Error($"Unexpected error: {ex.Message}");
        }
        finally
        {
          isStarted = false;
        }
    }

    static bool IsStarted(string message)
        {
                return message.Contains("start");
            
        }

        static void ProcessMessage(string message)
        {
            try
            {
                NasdaqResponse? response = JsonSerializer.Deserialize<NasdaqResponse>(message);
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
            }
        }
    }
}