if money <= balance:
    if money % 100 == 0:
        print("Видати гроші")
    else:
        print("Банкомат видає лише купюри по 100 грн")
else:
    print("Недостатньо коштів")
