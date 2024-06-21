using BlazorBootstrap;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
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
    public partial class Register
    {
        private Entities.RegisterDto _registerDto = new Entities.RegisterDto();
        private Models.RegisterModel _registerModel = new Models.RegisterModel();
        private FirstTerraceSystems.Entities.RegisterQuestion _registerQuestion = new FirstTerraceSystems.Entities.RegisterQuestion();

        private bool ShowRegister { get; set; } = true;

        protected override void OnInitialized()
        {
            base.OnInitialized();
        }

        private void BackToRegistration()
        {
            ShowRegister = true;
        }

        private async Task ValidateUserAsync()
        {
            var isValidEmail = await AuthenticationService.ValidateUserEmail(_registerDto.email);
            if (isValidEmail.GetValueOrDefault())
            {
                Toast.ShowWarningMessage("Email address already taken by another user.");
                return;
            }
            ShowRegister = false;
        }

        private async Task SaveAsync()
        {
            var registerDto = new RegisterModel
            {
                first_name = _registerDto.first_name,
                last_name = _registerDto.last_name,
                user_id = _registerDto.email,
                email = _registerDto.email?.ToLower(),
                password = _registerDto.password,
                confirm_password = _registerDto.confirm_password,
                company_name = _registerDto.company_name,
                city = _registerDto.city,
                phone = _registerDto.phone,
                address_1 = _registerDto.address_1,
                address_2 = _registerDto.address_2,
                state = _registerDto.state,
                region = _registerDto.region,
                postal_code = _registerDto.postal_code,
                country = _registerDto.country,
                trading_experience = new TradingExperience
                {
                    question_1 = _registerQuestion.Question_1,
                    question_2 = _registerQuestion.Question_2,
                    question_3 = _registerQuestion.Question_3,
                    question_4 = _registerQuestion.Question_4,
                    question_5 = _registerQuestion.Question_5,
                    question_6 = _registerQuestion.Question_6,
                    question_7 = _registerQuestion.Question_7,
                    question_8 = _registerQuestion.Question_8,
                    question_9 = _registerQuestion.Question_9,
                }
            };
            var registerResponse = await AuthenticationService.Registration(registerDto);

            if (registerResponse.Message == "User signed up successfully")
            {
                Toast.ShowWarningMessage("Registration successful");
                NavigationManager.NavigateTo("/login");
            }
            else
            {
                Toast.ShowWarningMessage(registerResponse?.Detail ?? "An error occurred during registration.");
            }
        }

        private void CloseApplication()
        {
            Application.Current?.Quit();
        }
    }
}