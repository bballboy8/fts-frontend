using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FirstTerraceSystems.Entities.Nasdaq;

namespace FirstTerraceSystems.Services
{
    public class NsdaqService
    {
        private string? _token;
        private DateTime _tokenExpirationTime;
        private readonly HttpClient _client;

        public NsdaqService()
        {
            _client = new HttpClient(new HttpClientHandler
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
            });
            _client.BaseAddress = new Uri("http://52.0.33.126:8000/");
            _client.Timeout = TimeSpan.FromSeconds(3600); // 1 hour
        }


        private async Task InitializeTokensAsync()
        {
            _token = await SecureStorage.GetAsync("NasdaqAuthToken");
            var expirationTime = await SecureStorage.GetAsync("NasdaqTokenExpirationTime");
            _tokenExpirationTime = DateTime.TryParse(expirationTime, out var expiration) ? expiration : DateTime.MinValue;
        }

        private async Task EnsureTokenIsValidAsync()
        {
            await InitializeTokensAsync();
            if (DateTime.UtcNow >= _tokenExpirationTime)
            {
                await RefreshTokenAsync();
            }
        }

        private async Task SaveTokensAsync(string token, DateTime tokenExpirationTime)
        {
            await SecureStorage.SetAsync("NasdaqAuthToken", token);
            await SecureStorage.SetAsync("NasdaqTokenExpirationTime", tokenExpirationTime.ToString("o"));
        }

        private async Task RefreshTokenAsync()
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "/v1/auth/token");

            string jsonData = JsonSerializer.Serialize(new
            {
                client_id = "firstterracesystem-kristopher-gontzes",
                client_secret = "xNptETKzwUAyrQlSrD9WmIZ8kJyZgQSO"
            });

            request.Content = new StringContent(jsonData, Encoding.UTF8, "application/json");

            try
            {
                var response = await _client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var contentString = await response.Content.ReadAsStringAsync();
                var token = JsonSerializer.Deserialize<TokenResponse>(contentString);

                _token = token!.AccessToken;
                _tokenExpirationTime = DateTime.UtcNow.AddSeconds(token!.ExpiresIn);

                await SaveTokensAsync(_token!, _tokenExpirationTime);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task<IEnumerable<EquitiesBarModal>?> GetEquitiesBars(DateTime startDate, DateTime endDate, string symbol)
        {
            await EnsureTokenIsValidAsync();

            string startDateString = startDate.ToString("yyyy-MM-ddTHH:mm");
            string endDateString = endDate.ToString("yyyy-MM-ddTHH:mm");
            string relativePath = $"/v1/nasdaq/delayed/equities/bars/{symbol}/1minute/{startDateString}/{endDateString}";

            var request = new HttpRequestMessage(HttpMethod.Get, relativePath);

            request.Headers.Add("Authorization", $"Bearer {_token}");

            try
            {
                var response = await _client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var contentString = await response.Content.ReadAsStringAsync();
                var equitiesBars = JsonSerializer.Deserialize<IEnumerable<EquitiesBarModal>>(contentString);

                return equitiesBars;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public async Task GetSymbolicData(DateTime date, string symbol)
        {
            //await EnsureTokenIsValidAsync();
            string jsonData = JsonSerializer.Serialize(new { target_date = date.ToString("yyyy-MM-d") });
            HttpRequestMessage request = new(HttpMethod.Post, "/nasdaq/get_data")
            {
                //request.Headers.Add("Authorization", $"Bearer {_token}");
                Content = new StringContent(jsonData, Encoding.UTF8, "application/json")
            };
            try
            {
                //HttpResponseMessage response = await _client.SendAsync(request);
                //response.EnsureSuccessStatusCode();                
                //var data = await response.Content.ReadFromJsonAsync<NasdaqData>();

                var data1Str = System.IO.File.ReadAllText(@"C:\Users\teamo\Desktop\test.json");
                var data1 = JsonSerializer.Deserialize<NasdaqData>(data1Str);
                //Updaye the data to the sqllite
                SqlLiteService sqlLiteService = new SqlLiteService();
                sqlLiteService.UpdateSymbolicDataToDB(data1);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);

            }
        }
    }


}
