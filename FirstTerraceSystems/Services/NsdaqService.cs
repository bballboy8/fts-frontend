using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FirstTerraceSystems.Entities.Nasdaq;

namespace FirstTerraceSystems.Services
{
    public class NsdaqService
    {
        private readonly HttpClient _client;

        public NsdaqService()
        {
            _client = new HttpClient();
        }

        public async Task<IEnumerable<EquitiesBarModal>?> GetEquitiesBars(DateTime startDate, string symbol)
        {
            var requestUrl = "http://52.0.33.126:8000/nasdaq/get_data";
            var requestData = new
            {
                start_datetime = startDate.ToString("yyyy-MM-ddTHH:mm"),
                symbol = symbol
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");

            try
            {
                var response = await _client.PostAsync(requestUrl, requestContent);
                response.EnsureSuccessStatusCode();
                var contentString = await response.Content.ReadAsStringAsync();
                var equitiesBars = JsonSerializer.Deserialize<IEnumerable<EquitiesBarModal>>(contentString);

                if (equitiesBars?.Count() > 5000)
                {
                    var report = new List<EquitiesBarModal>();
                    var maxElements = 5000;

                    // Calculate the number of elements to take (adjusted for exact 5000)
                    var elementsToTake = Math.Min(equitiesBars.Count(), maxElements);
                    var step = equitiesBars?.Count() / elementsToTake; // Adjust step size

                    for (int i = 0; i < elementsToTake; i++)
                    {
                        report.Add(equitiesBars?.ElementAt((int)(i * step))); // Access elements with step
                    }

                    return report;
                }

                return equitiesBars;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
    }
}