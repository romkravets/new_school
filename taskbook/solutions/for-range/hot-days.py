found = False
for t in temperature:
    if t > 25:
        print(t)
        found = True
if not found:
    print("Немає")
