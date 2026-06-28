INSERT INTO "usuarios" (nome, email, "senha_hash", pin, perfil, "restaurante_id", "criado_em")
SELECT 'Administrador', 'admin@chefflow.com', '$2a$10$QWccdfTdXEiMbQtF1eWwNOFscOGkk.sfNPrg6nSQK3JeD8VQQcqqq', '000000', 'ADMIN', NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "usuarios" WHERE email = 'admin@chefflow.com' AND "restaurante_id" IS NULL
);
