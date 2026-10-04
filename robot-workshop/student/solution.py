# Меняйте этот файл, сохраняйте и нажимайте «Проверить код» в игре.
# Экономикой управляет игра; здесь настраиваются только работники.
def configure_factory(factory):
    # Начните с одного участка. Имена tools и rules есть в карточках AUTO.
    warehouse = factory.worker("warehouse")
    warehouse.set_instructions("Следи за складом.")
    # warehouse.set_model("standard")
    # warehouse.set_context(5)
    # warehouse.add_tool("check_stock")
    # warehouse.enable_rule("check_before_order")
