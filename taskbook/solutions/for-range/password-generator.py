p1 = ""
p2 = ""
for i, s in enumerate(symbols):
    if i % 2 == 0:
        p1 += s
    else:
        p2 += s
print(p1)
print(p2)
print(len(p1), len(p2))
