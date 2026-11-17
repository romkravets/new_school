if login == "admin":
    if password == "12345":
        print("Доступ дозволено")
    else:
        print("Невірний пароль")
else:
    print("Користувача не знайдено")
