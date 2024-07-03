using System.Text;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using Newtonsoft.Json;

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

                HttpResponseMessage response = await _client.SendAsync(request);

                response.EnsureSuccessStatusCode();

                using (Stream responseStream = await response.Content.ReadAsStreamAsync())
                {
                    JsonSerializer? serializer = new Newtonsoft.Json.JsonSerializer();
                    using StreamReader? streamReader = new StreamReader(responseStream);
                    using JsonTextReader? textReader = new JsonTextReader(streamReader);
                    return serializer.Deserialize<IEnumerable<MarketFeed>>(textReader);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public async Task<IEnumerable<NasdaqTicker>?> NasdaqGetTickersAsync()
        {
            HttpRequestMessage request = new(HttpMethod.Get, "/nasdaq/get_tickers");
            try
            {
                HttpResponseMessage response = await _client.SendAsync(request);

                response.EnsureSuccessStatusCode();

                JsonSerializer? serializer = new Newtonsoft.Json.JsonSerializer();

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
