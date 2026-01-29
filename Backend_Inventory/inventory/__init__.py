import pymysql

# This tells Django to use pymysql as if it were the MySQLdb module
pymysql.install_as_MySQLdb()

default_app_config = 'inventory.apps.YourAppConfig'