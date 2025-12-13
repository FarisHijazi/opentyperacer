-- AlterTable: Make maxPlayers nullable (null = unlimited)
ALTER TABLE "Room" ALTER COLUMN "maxPlayers" DROP NOT NULL;
ALTER TABLE "Room" ALTER COLUMN "maxPlayers" DROP DEFAULT;
