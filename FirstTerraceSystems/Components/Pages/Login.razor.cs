using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class Login
    {
        private LoginDto _loginDto = new LoginDto();
        [Inject]
        public IAuthenticationService AuthenticationService { get; set; }
        [Inject]
        public NavigationManager NavigationManager { get; set; }
        public bool ShowAuthError { get; set; }
        public string Error { get; set; }

        public bool emailError { get; set; }
        public bool passwordError { get; set; }

        void CheckValidation()
        {
            if (string.IsNullOrEmpty(_loginDto.Email))
            {
                emailError = true;
            }

            if (string.IsNullOrEmpty(_loginDto.Password))
            {
                passwordError = true;
            }
        }

        public async Task ExecuteLogin()
        {
            

            ShowAuthError = false;
            var result = await AuthenticationService.Login(_loginDto);
            if (!string.IsNullOrEmpty(result.Detail))
            {
                Error = result.Detail == "User not found" ? "Invalid Username or Password" : result.Detail;
                ShowAuthError = true;
            }
            else
            {
                NavigationManager.NavigateTo("/multiChats");
            }
        }
    }
}
