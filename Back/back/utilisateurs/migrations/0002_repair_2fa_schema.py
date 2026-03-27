from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("utilisateurs", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE utilisateurs_utilisateur ADD COLUMN backup_codes text NOT NULL DEFAULT '[]';",
            reverse_sql="""
                CREATE TABLE utilisateurs_utilisateur_new AS
                SELECT id, password, last_login, is_superuser, username, first_name, last_name, email,
                       is_staff, is_active, date_joined, role, date_creation, totp_secret, totp_enabled
                FROM utilisateurs_utilisateur;
            """,
        ),
        migrations.RunSQL(
            sql="ALTER TABLE utilisateurs_utilisateur ADD COLUMN totp_last_verified_at datetime NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="ALTER TABLE utilisateurs_utilisateur ADD COLUMN totp_last_used_step bigint NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
                CREATE TABLE IF NOT EXISTS utilisateurs_twofactorchallenge (
                    id char(32) NOT NULL PRIMARY KEY,
                    expires_at datetime NOT NULL,
                    attempts smallint unsigned NOT NULL DEFAULT 0,
                    max_attempts smallint unsigned NOT NULL DEFAULT 5,
                    consumed_at datetime NULL,
                    created_at datetime NOT NULL,
                    ip_address char(39) NULL,
                    utilisateur_id bigint NOT NULL
                        REFERENCES utilisateurs_utilisateur(id)
                        DEFERRABLE INITIALLY DEFERRED
                );
                CREATE INDEX IF NOT EXISTS utilisateurs_twofactorchallenge_utilisateur_id_idx
                    ON utilisateurs_twofactorchallenge(utilisateur_id);
            """,
            reverse_sql="DROP TABLE IF EXISTS utilisateurs_twofactorchallenge;",
        ),
    ]

