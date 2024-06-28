using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FirstTerraceSystems.Entities;

namespace FirstTerraceSystems.Services
{
    public class NasdaqService
    {
        private readonly HttpClient _client;

        public NasdaqService(HttpClient client)
        {
            client.Timeout = TimeSpan.FromSeconds(3600); // 1 hour
            _client = client;
        }

        //Get & Update Stock data api
        //2024-06-25T18:30
        public async Task<List<SymbolicData>?> GetSymbolicData(DateTime startDatetime, string symbol)
        {
            string jsonData = JsonSerializer.Serialize(new { start_datetime = startDatetime.ToString("yyyy-MM-ddTHH:ss"), symbol = symbol });
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
                    return await JsonSerializer.DeserializeAsync<List<SymbolicData>>(responseStream);
                }

                //var responseString = await response.Content.ReadAsStringAsync();
                //return JsonSerializer.Deserialize<List<SymbolicData>>(responseString);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
    }
}
