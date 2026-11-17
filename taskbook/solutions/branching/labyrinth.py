if not exit_found:
    print("Продовжуйте пошуки лабіринту")
else:
    if door_open:
        print("Герой успішно залишає лабіринт")
    elif gold_key:
        print("Двері відкрито ключем. Герой вибрався з лабіринту!")
    elif magic_spell and mana >= 50:
        print("Двері відкрито магією. Герой вибрався з лабіринту!")
    else:
        print("Герой залишився у лабіринті")
