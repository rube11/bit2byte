from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import login


def home(request):
    return render(request, "frontpage.html")

def signup(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Account created — you can now log in!")
            return redirect("login")
    else:
        form = UserCreationForm()
    return render(request, "loginpage.html", {"form": form})

def about(request):
    return render(request, "about.html")

def loginpage(request):
    return render(request, "loginpage.html")
