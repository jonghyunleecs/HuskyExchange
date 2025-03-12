CREATE TABLE "products" (
	"id"	INTEGER,
	"username"	TEXT,
	"name"	TEXT,
	"price"	NUMERIC,
	"image"	TEXT,
	"description"	TEXT,
	"category"	TEXT,
	"purchased"	INTEGER,
	PRIMARY KEY("id"),
	FOREIGN KEY("username") REFERENCES "users"("username")
);

CREATE TABLE "purchases" (
	"id"	TEXT,
	"name"	TEXT,
	"buyer"	TEXT,
	"seller"	TEXT,
	"price"	INTEGER,
	"image"	TEXT,
	"description"	TEXT,
	"category"	TEXT,
	"purchase_date"	TEXT,
	PRIMARY KEY("id"),
	FOREIGN KEY("buyer") REFERENCES "users"("username"),
	FOREIGN KEY("seller") REFERENCES "users"("username")
);

CREATE TABLE "users" (
	"username"	TEXT,
	"email"	TEXT,
	"password"	TEXT,
	"token"	TEXT,
	PRIMARY KEY("username")
);