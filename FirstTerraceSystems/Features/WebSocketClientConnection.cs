using Microsoft.AspNetCore.Components;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using FirstTerraceSystems.Models;

namespace FirstTerraceSystems.Features
{
    public static class WebSocketClientConnection
    {
        static ClientWebSocket mWebsocket;
        public delegate void OnMessageReceivedDelegate(string vMessage);
        static ConcurrentBag<OnMessageReceivedDelegate> mListeners = new();
        public static NavigationManager NavigationManager;
        static CancellationToken mCancellationToken;
        public static string Username;

        public static void AddListener(OnMessageReceivedDelegate vListener)
        {
            if ((mWebsocket == null)
                || (mWebsocket.State != WebSocketState.Open))
            {
                mWebsocket = new();
                _ = ConnectAsync();
            }
            mListeners.Add(vListener);
        }

        public static void ClearListeners()
        {
            mListeners.Clear();
        }

        static string GetUrl()
        {
            string pUrl;
            var pUri = new Uri(NavigationManager.Uri);
            if (pUri.Scheme == "https")
                pUrl = "wss";
            else
                pUrl = "ws";
            pUrl += Uri.SchemeDelimiter + pUri.Authority + "/api/WebSockets/Get?Username=" + Username;

            return pUrl;
        }

        static async Task ConnectAsync()
        {
            var pUri = new Uri("ws://52.0.33.126:8000/nasdaq/get_real_data");
            mCancellationToken = new();
            await mWebsocket.ConnectAsync(pUri, mCancellationToken);
            var pBuffer = new ArraySegment<byte>(new byte[2048]);
            while (!mCancellationToken.IsCancellationRequested)
            {
                WebSocketReceiveResult pResult;
                var pStream = new MemoryStream();
                do
                {
                    pResult = await mWebsocket.ReceiveAsync(pBuffer, mCancellationToken);
                    pStream.Write(pBuffer.Array, pBuffer.Offset, pResult.Count);
                } while (!pResult.EndOfMessage);

                pStream.Seek(0, SeekOrigin.Begin);

                var pMessage = Encoding.UTF8.GetString(pStream.ToArray());
                foreach (var pListener in mListeners)
                    pListener.Invoke(pMessage);

                if (pResult.MessageType == WebSocketMessageType.Close)
                {
                    foreach (var pListener in mListeners)
                        pListener.Invoke("Self is closing");
                    break;
                }
            }
        }

        public static Task SendStringAsync(string vText)
        {
            var pBytes = Encoding.UTF8.GetBytes(vText);
            var pBuffer = new ArraySegment<byte>(pBytes, 0, pBytes.Length);
            try
            {
                return mWebsocket.SendAsync(pBuffer, WebSocketMessageType.Text, endOfMessage: true, mCancellationToken);
            }
            catch (Exception ex)
            {
                var pText = Message.ToString(Message.eType.Error, ex.Message);
                foreach (var pListener in mListeners)
                    pListener.Invoke(pText);
                return Task.CompletedTask;
            }
        }

        public static async Task Close()
        {
            if ((mWebsocket != null)
                || (mWebsocket.State == WebSocketState.Open))
            {
                await mWebsocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
                mWebsocket.Dispose();
                mWebsocket = null;
            }
            mListeners.Clear();
        }
    }
}