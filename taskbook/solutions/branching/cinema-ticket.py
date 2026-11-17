if age < 6 or age >= 65:
    price = 0.0
elif day == "Середа":
    price = 200 * 0.7
else:
    price = 200.0
print(round(price, 2))
