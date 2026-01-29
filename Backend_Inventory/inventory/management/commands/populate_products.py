from django.core.management.base import BaseCommand
from inventory.models import Product


class Command(BaseCommand):
    help = 'Populate the database with initial laboratory products'

    def handle(self, *args, **options):
        products = [
            # Glassware
            {"name": "Beaker 250ml", "description": "Borosilicate glass beaker, 250ml capacity", "category": "glassware", "price": 12.99, "stock_quantity": 50, "low_stock_threshold": 10},
            {"name": "Beaker 500ml", "description": "Borosilicate glass beaker, 500ml capacity", "category": "glassware", "price": 15.99, "stock_quantity": 45, "low_stock_threshold": 10},
            {"name": "Beaker 1000ml", "description": "Borosilicate glass beaker, 1000ml capacity", "category": "glassware", "price": 19.99, "stock_quantity": 30, "low_stock_threshold": 8},
            {"name": "Erlenmeyer Flask 250ml", "description": "Conical flask for mixing and heating", "category": "glassware", "price": 14.50, "stock_quantity": 40, "low_stock_threshold": 10},
            {"name": "Erlenmeyer Flask 500ml", "description": "Conical flask, 500ml capacity", "category": "glassware", "price": 17.50, "stock_quantity": 35, "low_stock_threshold": 8},
            {"name": "Test Tube 15ml", "description": "Borosilicate test tube, pack of 10", "category": "glassware", "price": 8.99, "stock_quantity": 100, "low_stock_threshold": 20},
            {"name": "Graduated Cylinder 100ml", "description": "Precision measuring cylinder", "category": "glassware", "price": 22.00, "stock_quantity": 25, "low_stock_threshold": 5},
            {"name": "Volumetric Flask 250ml", "description": "Class A volumetric flask", "category": "glassware", "price": 28.00, "stock_quantity": 20, "low_stock_threshold": 5},
            {"name": "Pipette 10ml", "description": "Graduated glass pipette", "category": "glassware", "price": 6.50, "stock_quantity": 60, "low_stock_threshold": 15},
            {"name": "Pipette 25ml", "description": "Graduated glass pipette", "category": "glassware", "price": 7.50, "stock_quantity": 55, "low_stock_threshold": 15},
            
            # Chemicals
            {"name": "Ethanol 95%", "description": "Laboratory grade ethanol, 1L bottle", "category": "chemicals", "price": 24.99, "stock_quantity": 30, "low_stock_threshold": 10},
            {"name": "Sodium Chloride", "description": "ACS grade NaCl, 500g", "category": "chemicals", "price": 18.50, "stock_quantity": 40, "low_stock_threshold": 10},
            {"name": "Hydrochloric Acid 1M", "description": "1M HCl solution, 500ml", "category": "chemicals", "price": 22.00, "stock_quantity": 25, "low_stock_threshold": 8},
            {"name": "Sodium Hydroxide", "description": "NaOH pellets, 500g", "category": "chemicals", "price": 19.99, "stock_quantity": 35, "low_stock_threshold": 10},
            {"name": "Sulfuric Acid 1M", "description": "1M H2SO4 solution, 500ml", "category": "chemicals", "price": 25.00, "stock_quantity": 20, "low_stock_threshold": 5},
            {"name": "Acetone", "description": "ACS grade acetone, 1L", "category": "chemicals", "price": 21.50, "stock_quantity": 28, "low_stock_threshold": 8},
            {"name": "Methanol", "description": "HPLC grade methanol, 1L", "category": "chemicals", "price": 32.00, "stock_quantity": 22, "low_stock_threshold": 6},
            {"name": "Distilled Water", "description": "Laboratory grade, 5L container", "category": "chemicals", "price": 8.99, "stock_quantity": 50, "low_stock_threshold": 15},
            {"name": "Phenolphthalein Indicator", "description": "1% solution, 100ml", "category": "chemicals", "price": 12.00, "stock_quantity": 30, "low_stock_threshold": 10},
            {"name": "Litmus Paper", "description": "pH indicator strips, pack of 100", "category": "chemicals", "price": 9.99, "stock_quantity": 45, "low_stock_threshold": 15},
            
            # Equipment
            {"name": "Bunsen Burner", "description": "Standard laboratory burner with adjustable flame", "category": "equipment", "price": 45.00, "stock_quantity": 15, "low_stock_threshold": 3},
            {"name": "Hot Plate", "description": "Electric hot plate with temperature control", "category": "equipment", "price": 89.00, "stock_quantity": 10, "low_stock_threshold": 2},
            {"name": "Magnetic Stirrer", "description": "Magnetic stirrer with hot plate", "category": "equipment", "price": 125.00, "stock_quantity": 8, "low_stock_threshold": 2},
            {"name": "Analytical Balance", "description": "Precision balance, 0.0001g accuracy", "category": "equipment", "price": 450.00, "stock_quantity": 5, "low_stock_threshold": 1},
            {"name": "pH Meter", "description": "Digital pH meter with probe", "category": "equipment", "price": 85.00, "stock_quantity": 12, "low_stock_threshold": 3},
            {"name": "Centrifuge", "description": "Benchtop centrifuge, 6000 RPM", "category": "equipment", "price": 320.00, "stock_quantity": 4, "low_stock_threshold": 1},
            {"name": "Microscope", "description": "Compound microscope, 40x-1000x", "category": "equipment", "price": 275.00, "stock_quantity": 6, "low_stock_threshold": 2},
            {"name": "Thermometer Digital", "description": "Digital thermometer, -50 to 300°C", "category": "equipment", "price": 35.00, "stock_quantity": 20, "low_stock_threshold": 5},
            {"name": "Stopwatch", "description": "Digital stopwatch with lap timer", "category": "equipment", "price": 18.00, "stock_quantity": 25, "low_stock_threshold": 5},
            {"name": "Tongs", "description": "Crucible tongs, stainless steel", "category": "equipment", "price": 12.00, "stock_quantity": 30, "low_stock_threshold": 8},
            
            # Consumables
            {"name": "Petri Dishes", "description": "Sterile plastic petri dishes, pack of 20", "category": "consumables", "price": 15.99, "stock_quantity": 80, "low_stock_threshold": 20},
            {"name": "Filter Paper", "description": "Qualitative filter paper, pack of 100", "category": "consumables", "price": 12.50, "stock_quantity": 60, "low_stock_threshold": 15},
            {"name": "Parafilm", "description": "Sealing film, 4 inch x 125 ft roll", "category": "consumables", "price": 28.00, "stock_quantity": 25, "low_stock_threshold": 5},
            {"name": "Microcentrifuge Tubes", "description": "1.5ml tubes, pack of 500", "category": "consumables", "price": 22.00, "stock_quantity": 40, "low_stock_threshold": 10},
            {"name": "Pipette Tips 200ul", "description": "Disposable tips, pack of 1000", "category": "consumables", "price": 35.00, "stock_quantity": 50, "low_stock_threshold": 10},
            {"name": "Pipette Tips 1000ul", "description": "Disposable tips, pack of 1000", "category": "consumables", "price": 38.00, "stock_quantity": 45, "low_stock_threshold": 10},
            {"name": "Cuvettes", "description": "Plastic cuvettes, pack of 100", "category": "consumables", "price": 25.00, "stock_quantity": 35, "low_stock_threshold": 8},
            {"name": "Weighing Paper", "description": "Non-stick weighing paper, pack of 500", "category": "consumables", "price": 14.00, "stock_quantity": 40, "low_stock_threshold": 10},
            {"name": "Aluminum Foil", "description": "Heavy duty lab foil, 75 sq ft roll", "category": "consumables", "price": 16.00, "stock_quantity": 30, "low_stock_threshold": 8},
            {"name": "Lab Tape", "description": "Autoclave-safe labeling tape", "category": "consumables", "price": 8.50, "stock_quantity": 50, "low_stock_threshold": 15},
            
            # Safety
            {"name": "Safety Goggles", "description": "Chemical splash goggles, ANSI approved", "category": "safety", "price": 12.00, "stock_quantity": 40, "low_stock_threshold": 10},
            {"name": "Lab Coat", "description": "White cotton lab coat, medium", "category": "safety", "price": 28.00, "stock_quantity": 25, "low_stock_threshold": 5},
            {"name": "Lab Coat Large", "description": "White cotton lab coat, large", "category": "safety", "price": 28.00, "stock_quantity": 20, "low_stock_threshold": 5},
            {"name": "Nitrile Gloves S", "description": "Powder-free nitrile gloves, box of 100, small", "category": "safety", "price": 18.00, "stock_quantity": 60, "low_stock_threshold": 15},
            {"name": "Nitrile Gloves M", "description": "Powder-free nitrile gloves, box of 100, medium", "category": "safety", "price": 18.00, "stock_quantity": 80, "low_stock_threshold": 20},
            {"name": "Nitrile Gloves L", "description": "Powder-free nitrile gloves, box of 100, large", "category": "safety", "price": 18.00, "stock_quantity": 70, "low_stock_threshold": 15},
            {"name": "Face Shield", "description": "Full face protection shield", "category": "safety", "price": 15.00, "stock_quantity": 20, "low_stock_threshold": 5},
            {"name": "First Aid Kit", "description": "Laboratory first aid kit", "category": "safety", "price": 45.00, "stock_quantity": 10, "low_stock_threshold": 2},
            {"name": "Fire Extinguisher", "description": "ABC dry chemical extinguisher", "category": "safety", "price": 55.00, "stock_quantity": 8, "low_stock_threshold": 2},
            {"name": "Spill Kit", "description": "Chemical spill cleanup kit", "category": "safety", "price": 65.00, "stock_quantity": 6, "low_stock_threshold": 2},
        ]

        created_count = 0
        updated_count = 0

        for product_data in products:
            product, created = Product.objects.update_or_create(
                name=product_data['name'],
                defaults=product_data
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated products: {created_count} created, {updated_count} updated'
            )
        )
