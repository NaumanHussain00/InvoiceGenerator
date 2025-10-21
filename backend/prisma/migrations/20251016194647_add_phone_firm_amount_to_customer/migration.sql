/*
  Warnings:

  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firm` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Customer_email_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "email",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "firm" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;
