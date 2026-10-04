def configure_factory(factory):
    worker = factory.worker("warehouse")
    worker.set_model("standard")
    worker.set_context(5)  # Только 0, 2, 5, 10, 20.
    worker.set_instructions("Перед закупкой проверь остатки.")
    worker.enable_rule("check_before_order")
    worker.add_tool("check_stock")
    # Также доступны disable_rule(...) и remove_tool(...).
    # Другие роли: reception, engineer, assembler, qc, cleaner.
