INSERT INTO "Usuario" (nome, email, "senhaHash", pin, perfil, "restauranteId", "criadoEm")
SELECT 'Administrador', 'admin@chefflow.com', '$2a$10$QWccdfTdXEiMbQtF1eWwNOFscOGkk.sfNPrg6nSQK3JeD8VQQcqqq', '000000', 'ADMIN', NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Usuario" WHERE email = 'admin@chefflow.com' AND "restauranteId" IS NULL
);
