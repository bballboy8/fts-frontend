using System.Buffers;
using System.IO.Compression;
using System.IO.Pipelines;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using Newtonsoft.Json;
using Serilog;

namespace FirstTerraceSystems.Services
{
    public class NasdaqService
    {
        private readonly HttpClient _client;

        public NasdaqService(HttpClient client)
        {
            _client = client;
        }

        //NasdaqMarketFeed
        public async Task<IEnumerable<MarketFeed>?> NasdaqGetDataAsync(DateTime startDatetime, string symbol)
        {
            string jsonData = System.Text.Json.JsonSerializer.Serialize(new { start_datetime = startDatetime.ToString(AppSettings.DFormat_NasdaqGetData), symbol = symbol });
            HttpRequestMessage request = new(HttpMethod.Post, "/nasdaq/get_data")
            {
                Content = new StringContent(jsonData, Encoding.UTF8, "application/json")
            };
            try
            {

                HttpResponseMessage response = await _client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

                response.EnsureSuccessStatusCode();

                return await DeserializeStreamAsync(await response.Content.ReadAsStreamAsync());

            }
            catch (Exception ex)
            {
                Log.Logger.Error(ex, "NasdaqGetDataAsync");
                Console.WriteLine(ex.Message);
                return null;
            }
        }
        public async Task<List<HolidayList>?> GetHolidays()
        {
            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, "http://52.0.33.126:8000/nasdaq/holidays");
            request.Headers.Add("accept", "application/json");
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();
            string content = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<List<HolidayList>>(content);

        }
        private async Task<IEnumerable<MarketFeed>> DeserializeStreamAsync(Stream stream)
        {
            var result = new List<MarketFeed>();
            var serializer = new Newtonsoft.Json.JsonSerializer();

            using (var gzipStream = new GZipStream(stream, CompressionMode.Decompress))
            using (var sr = new StreamReader(gzipStream))
            using (var jr = new JsonTextReader(sr))
            {
                jr.SupportMultipleContent = true; // Allow reading multiple JSON objects

                while (await jr.ReadAsync())
                {
                    if (jr.TokenType == JsonToken.StartObject)
                    {
                        var marketFeed = serializer.Deserialize<MarketFeed>(jr);
                        if (marketFeed != null)
                        {
                            result.Add(marketFeed);
                        }
                    }
                }
            }

            return result;
        }

        public async Task<IEnumerable<NasdaqTicker>?> NasdaqGetTickersAsync()
        {
            HttpRequestMessage request = new(HttpMethod.Get, "/nasdaq/get_tickers");
            try
            {
                HttpResponseMessage response = await _client.SendAsync(request);

                response.EnsureSuccessStatusCode();

                Newtonsoft.Json.JsonSerializer? serializer = new Newtonsoft.Json.JsonSerializer();

                using (Stream responseStream = await response.Content.ReadAsStreamAsync())
                {
                    using StreamReader? streamReader = new StreamReader(responseStream);
                    using JsonTextReader? textReader = new JsonTextReader(streamReader);
                    return serializer.Deserialize<IEnumerable<NasdaqTicker>>(textReader);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
    }
}
