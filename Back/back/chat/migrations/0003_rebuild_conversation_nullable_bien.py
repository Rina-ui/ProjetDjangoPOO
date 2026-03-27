from django.db import migrations


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("chat", "0002_alter_conversation_bien_nullable"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                PRAGMA foreign_keys=OFF;

                CREATE TABLE chat_conversation_new (
                    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    created_at datetime NOT NULL,
                    bien_id bigint NULL REFERENCES patrimoine_bien(id) DEFERRABLE INITIALLY DEFERRED,
                    client_id bigint NOT NULL REFERENCES utilisateurs_utilisateur(id) DEFERRABLE INITIALLY DEFERRED,
                    proprietaire_id bigint NOT NULL REFERENCES utilisateurs_utilisateur(id) DEFERRABLE INITIALLY DEFERRED
                );

                INSERT INTO chat_conversation_new (id, created_at, bien_id, client_id, proprietaire_id)
                SELECT id, created_at, bien_id, client_id, proprietaire_id
                FROM chat_conversation;

                DROP TABLE chat_conversation;
                ALTER TABLE chat_conversation_new RENAME TO chat_conversation;

                CREATE UNIQUE INDEX IF NOT EXISTS chat_conversation_bien_id_client_id_uniq
                    ON chat_conversation (bien_id, client_id);
                CREATE INDEX IF NOT EXISTS chat_conversation_bien_id_idx
                    ON chat_conversation (bien_id);
                CREATE INDEX IF NOT EXISTS chat_conversation_client_id_idx
                    ON chat_conversation (client_id);
                CREATE INDEX IF NOT EXISTS chat_conversation_proprietaire_id_idx
                    ON chat_conversation (proprietaire_id);

                PRAGMA foreign_keys=ON;
            """,
            reverse_sql=migrations.RunSQL.noop,
        )
    ]


