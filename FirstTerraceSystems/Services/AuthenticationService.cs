using Blazored.LocalStorage;
using FirstTerraceSystems.AuthProviders;
using FirstTerraceSystems.Components.Pages;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using Microsoft.AspNetCore.Components.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _options;
        private readonly AuthenticationStateProvider _authStateProvider;
        private readonly ILocalStorageService _localStorage;
        public AuthenticationService(HttpClient client, AuthenticationStateProvider authStateProvider, ILocalStorageService localStorage)
        {
            _client = client;
            _options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            _authStateProvider = authStateProvider;
            _localStorage = localStorage;
        }

        
        public async Task<AuthResponseDto> Login(LoginDto model)
        {
            var content = JsonSerializer.Serialize(new { email = model.Email.ToLower(), password = model.Password }, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(content, Encoding.UTF8, "application/json");

            var authResult = await _client.PostAsync("user/login", bodyContent);
            var authContent = await authResult.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<AuthResponseDto>(authContent, _options);

            if (!authResult.IsSuccessStatusCode)
                return result;

            await _localStorage.SetItemAsync("authToken", result.Access_Token);
            await _localStorage.SetItemAsync("email", model.Email);

            ((AuthStateProvider)_authStateProvider).NotifyUserAuthentication(model.Email);
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("bearer", result.Access_Token);

            return new AuthResponseDto();
        }

        public async Task<RegisterResponseDto> Registration(RegisterModel model)
        {
            var content = JsonSerializer.Serialize(model, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(content, Encoding.UTF8, "application/json");

            var authResult = await _client.PostAsync("user/signup", bodyContent);
            var authContent = await authResult.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RegisterResponseDto>(authContent, _options);

            return result;
        }


        public async Task Logout(LoginDto model)
        {
            var email = await _localStorage.GetItemAsync<string>("email");
            var content = JsonSerializer.Serialize(new { email = email.ToLower() }, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var bodyContent = new StringContent(content, Encoding.UTF8, "application/json");

            var authResult = await _client.PostAsync("user/logout", bodyContent);
            var authContent = await authResult.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<AuthResponseDto>(authContent, _options);

            await _localStorage.RemoveItemAsync("authToken");
            ((AuthStateProvider)_authStateProvider).NotifyUserLogout();
            _client.DefaultRequestHeaders.Authorization = null;
        }
    }
}
