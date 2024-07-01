using FirstTerraceSystems.AuthProviders;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services.IServices;
using Microsoft.AspNetCore.Components.Authorization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FirstTerraceSystems.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _options;
        private readonly AuthenticationStateProvider _authStateProvider;
        public AuthenticationService(HttpClient client, AuthenticationStateProvider authStateProvider)
        {
            _client = client;
            _options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            _authStateProvider = authStateProvider;
        }


        public async Task<AuthResponse> Login(LoginDto model)
        {
            var content = JsonSerializer.Serialize(new { email = model.Email?.ToLower(), password = model.Password }, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(content, Encoding.UTF8, "application/json");

            var authResult = await _client.PostAsync("user/login", bodyContent);
            var authContent = await authResult.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<AuthResponse>(authContent, _options);

            if (!authResult.IsSuccessStatusCode)
                return result!;

            await SecureStorage.SetAsync(AppSettings.SS_AuthToken, result?.Access_Token ?? "");
            await SecureStorage.SetAsync(AppSettings.SS_AuthEmail, model.Email ?? "");

            ((AuthStateProvider)_authStateProvider).NotifyUserAuthentication(model.Email ?? "");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("bearer", result?.Access_Token);

            return new AuthResponse();
        }

        public async Task<RegisterResponseDto> Registration(RegisterModel model)
        {
            var content = JsonSerializer.Serialize(model, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(content, Encoding.UTF8, "application/json");

            var authResult = await _client.PostAsync("user/signup", bodyContent);

            try
            {
                authResult.EnsureSuccessStatusCode();
                var authContent = await authResult.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<RegisterResponseDto>(authContent, _options);
                return result!;
            }
            catch (Exception ex)
            {
                return new RegisterResponseDto { Message = ex.Message };
            }
        }


        public async Task Logout(LoginDto model)
        {
            var email = await SecureStorage.GetAsync(AppSettings.SS_AuthEmail);
            var content = JsonSerializer.Serialize(new { email = email?.ToLower() }, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(content, Encoding.UTF8, "application/json");

            var authResult = await _client.PostAsync("user/logout", bodyContent);

            authResult.EnsureSuccessStatusCode();

            var authContent = await authResult.Content.ReadAsStringAsync();

            var result = JsonSerializer.Deserialize<AuthResponse>(authContent, _options);

            SecureStorage.RemoveAll();
            //SecureStorage.Remove(ApplicationConst.SS_AuthToken);
            ((AuthStateProvider)_authStateProvider).NotifyUserLogout();
            _client.DefaultRequestHeaders.Authorization = null;
        }

        public async Task<bool?> ValidateUserEmail(string? email)
        {
            var serializeBodyContent = JsonSerializer.Serialize(new { email = email?.ToLower() }, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(serializeBodyContent, Encoding.UTF8, "application/json");

            try
            {
                var response = await _client.PostAsync("user/exist_email", bodyContent);

                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();

                using (JsonDocument doc = JsonDocument.Parse(responseContent))
                {
                    return doc.RootElement.GetProperty("exist").GetBoolean();
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
