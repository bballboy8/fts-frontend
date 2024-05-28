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
        private RegisterDto _registerDto = new RegisterDto();
        private RegisterModel _registerModel = new RegisterModel();
        private FirstTerraceSystems.Entities.RegisterQuestion _registerQuestion = new FirstTerraceSystems.Entities.RegisterQuestion();

        [Inject] public IAuthenticationService AuthenticationService { get; set; }
        [Inject] public NavigationManager NavigationManager { get; set; }
        [Parameter] public RegisterModel RegisterModal { get; set; } = new();
       /* [CascadingParameter] private MudDialogInstance MudDialog { get; set; }*/

        public bool ShowAuthError { get; set; }
        public string Error { get; set; }
        private bool ShowRegister { get; set; } = true;

        private void BackToRegistration()
        {
            ShowRegister = true;
        }

        private async Task SaveAsync()
        {
            var registerDto = new RegisterModel
            {
                first_name = _registerDto.first_name,
                last_name = _registerDto.last_name,
                user_id = _registerDto.email ,
                email = _registerDto.email.ToLower(),
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
                    question_6 = _registerQuestion.Question_6 ,
                    question_7 = _registerQuestion.Question_7,
                    question_8 = _registerQuestion.Question_8 ,
                    question_9 = _registerQuestion.Question_9 ,
                }
            };

            var registerResponse = await AuthenticationService.Registration(registerDto);
            if (registerResponse != null)
            {
                ToastService.Notify(new(ToastType.Success, "Registration successful"));
                //_snackBar.Add("Registration successful", Severity.Success);
                NavigationManager.NavigateTo("/login");
            }
            else
            {
                Error = registerResponse?.Message ?? "An error occurred during registration.";
                ShowAuthError = true;
                //_snackBar.Add(Error, Severity.Error);
                ToastService.Notify(new(ToastType.Warning, Error));
            }
        }

    }
}