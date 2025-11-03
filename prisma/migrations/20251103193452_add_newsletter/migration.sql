-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "newsletter";

-- CreateEnum
CREATE TYPE "newsletter"."PostType" AS ENUM ('EVENT', 'NEWS', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "newsletter"."Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "markdown" TEXT NOT NULL,
    "organization" TEXT,
    "category" TEXT,
    "author" TEXT,
    "type" "newsletter"."PostType" NOT NULL DEFAULT 'NEWS',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter"."PostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "newsletter"."Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "newsletter"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "newsletter"."Tag"("slug");

-- AddForeignKey
ALTER TABLE "newsletter"."PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "newsletter"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter"."PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "newsletter"."Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
