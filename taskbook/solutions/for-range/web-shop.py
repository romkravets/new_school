new_prices = []
before = 0
after = 0
for price in prices:
    if price > 1000:
        new = round(price * 0.9, 2)
    elif price > 500:
        new = round(price * 0.95, 2)
    else:
        new = price
    new_prices.append(new)
    before += price
    after += new
print(new_prices)
print(before)
print(round(after, 2))
print(round(before - after, 2))
