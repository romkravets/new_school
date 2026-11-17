balance = deposit
for year in range(1, years + 1):
    balance = round(balance * 1.12, 2)
    print(f"{year}: {balance:.2f}")
print(f"Разом: {balance:.2f}")
