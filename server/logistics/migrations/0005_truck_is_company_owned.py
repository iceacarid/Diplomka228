# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('logistics', '0004_order_cargo_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='truck',
            name='is_company_owned',
            field=models.BooleanField(default=True, verbose_name='Машина компании'),
        ),
    ]
