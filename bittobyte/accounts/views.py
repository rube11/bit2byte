from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.forms import AuthenticationForm
from .forms import CustomUserCreationForm

def home(request):
    return render(request, "frontpage.html")


def login_signup(request):
    login_form = AuthenticationForm()
    signup_form = CustomUserCreationForm()
    active_form = "login"

    if request.method == "POST":
        if 'login' in request.POST:
            login_form = AuthenticationForm(request, data=request.POST)
            if login_form.is_valid():
                user = login_form.get_user()
                login(request, user)
                return redirect('home')
        elif 'signup' in request.POST:
            signup_form = CustomUserCreationForm(request.POST)
            active_form = "signup"
            if signup_form.is_valid():
                user = signup_form.save()
                login(request, user)
                return redirect('home')
            else:
                messages.error(request, "Signup failed. Passwords do not match or are under 8 characters.")

    return render(request, "loginpage.html", {
        "login_form": login_form,
        "signup_form": signup_form,
        "active_form": active_form
    })
def about(request):
    return render(request, "about.html")