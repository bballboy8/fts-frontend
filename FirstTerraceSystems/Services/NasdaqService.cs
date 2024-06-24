using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
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
        public async Task<List<SymbolicData>?> GetSymbolicData(DateTime startDatetime, string symbol)
        {
            string jsonData = JsonSerializer.Serialize(new { start_datetime = startDatetime.ToString("yyyy-MM-d HH:mm:ss"), symbol });
            HttpRequestMessage request = new(HttpMethod.Post, "/nasdaq/get_data")
            {
                Content = new StringContent(jsonData, Encoding.UTF8, "application/json")
            };
            try
            {
                HttpResponseMessage response = await _client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<List<SymbolicData>>();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
    }
}
