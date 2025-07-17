const { Pool } = require("pg");
const crypto = require("crypto");

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

// Log database configuration for debugging
console.log("🔧 Database Configuration:");
console.log("Host:", process.env.DB_HOST || "localhost");
console.log("Port:", process.env.DB_PORT || "5432");
console.log("User:", process.env.DB_USER || "postgres");
console.log("Database:", process.env.DB_NAME || "workshop_db");
console.log("Password:", process.env.DB_PASSWORD ? "***" : "admin123");

// Database configuration for initial connection (without specific database)
const initialPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: "postgres", // Connect to default postgres database first
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Database configuration for workshop_db
const workshopPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Simple hash function to replace bcrypt
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Indonesian names and data for realistic user generation
const indonesianNames = {
  male: [
    "Ahmad",
    "Budi",
    "Candra",
    "Dedi",
    "Eko",
    "Fajar",
    "Gunawan",
    "Hadi",
    "Indra",
    "Joko",
    "Kusuma",
    "Lukman",
    "Maman",
    "Nugroho",
    "Oscar",
    "Prabowo",
    "Rudi",
    "Sukarno",
    "Tono",
    "Ujang",
    "Wahyu",
    "Yanto",
    "Zainal",
    "Ade",
    "Bambang",
    "Cecep",
    "Darmawan",
    "Edy",
    "Firman",
    "Gatot",
    "Hendra",
    "Iwan",
    "Jaya",
    "Kartika",
    "Lukas",
    "Mulyadi",
    "Nugraha",
    "Oki",
    "Purnama",
    "Rahmat",
    "Samsul",
    "Taufik",
    "Udin",
    "Wawan",
    "Yusuf",
    "Asep",
    "Bakti",
    "Cahya",
    "Doni",
    "Erik",
  ],
  female: [
    "Siti",
    "Rina",
    "Dewi",
    "Nina",
    "Yuni",
    "Sari",
    "Maya",
    "Lina",
    "Dina",
    "Eka",
    "Fitri",
    "Gita",
    "Hani",
    "Indah",
    "Juli",
    "Kartika",
    "Lusi",
    "Mira",
    "Nia",
    "Oki",
    "Putri",
    "Rini",
    "Sukiyem",
    "Tika",
    "Umi",
    "Vina",
    "Wati",
    "Yani",
    "Zahra",
    "Aisyah",
    "Bunga",
    "Citra",
    "Dinda",
    "Eva",
    "Fina",
    "Gadis",
    "Hilda",
    "Indri",
    "Juwita",
    "Kartini",
    "Lestari",
    "Murni",
    "Nurul",
    "Oktavia",
    "Puspita",
    "Ratna",
    "Saminem",
    "Tuti",
    "Uswah",
    "Vivi",
    "Widya",
    "Yulia",
    "Zahira",
    "Aida",
    "Bella",
    "Cinta",
    "Dara",
    "Elsa",
    "Fika",
    "Gina",
  ],
  surnames: [
    "Saputra",
    "Wijaya",
    "Purnama",
    "Kusuma",
    "Nugraha",
    "Rahmat",
    "Surya",
    "Pratama",
    "Hidayat",
    "Wibowo",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
    "Siregar",
    "Nasution",
    "Ginting",
    "Tarigan",
    "Sembiring",
    "Sinaga",
    "Sitepu",
    "Purba",
    "Saragih",
    "Sianturi",
    "Manurung",
    "Sitorus",
    "Simanjuntak",
    "Sihombing",
    "Panggabean",
    "Silitonga",
    "Sihotang",
    "Samosir",
    "Situmorang",
    "Sibagariang",
    "Siboro",
    "Sihite",
    "Siahaan",
    "Simatupang",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
  ],
};

const indonesianBios = [
  "Suka ngopi di warung kopi tradisional",
  "Pecinta kuliner Indonesia",
  "Hobi main badminton di lapangan dekat rumah",
  "Suka nonton wayang kulit",
  "Pecinta musik dangdut",
  "Hobi berkebun di halaman rumah",
  "Suka masak rendang dan sate",
  "Pecinta batik dan budaya tradisional",
  "Hobi main catur di warung kopi",
  "Suka jalan-jalan ke pasar tradisional",
  "Pecinta kerajinan tangan",
  "Hobi memancing di sungai",
  "Suka nonton sinetron Indonesia",
  "Pecinta makanan pedas",
  "Hobi berkumpul dengan keluarga besar",
  "Suka main gitar dan nyanyi lagu daerah",
  "Pecinta tanaman hias",
  "Hobi memasak untuk keluarga",
  "Suka nonton pertandingan sepak bola",
  "Pecinta wisata kuliner",
  "Hobi berkebun sayuran",
  "Suka main kartu dengan tetangga",
  "Pecinta lagu-lagu lawas Indonesia",
  "Hobi membuat kerajinan dari bambu",
  "Suka nonton wayang golek",
  "Pecinta makanan tradisional",
  "Hobi berkumpul di pos ronda",
  "Suka main domino dengan teman",
  "Pecinta budaya Sunda",
  "Hobi membuat batik tulis",
  "Suka nonton pertunjukan wayang",
  "Pecinta makanan Betawi",
  "Hobi berkebun bunga",
  "Suka main angklung",
  "Pecinta lagu-lagu keroncong",
  "Hobi membuat kerajinan dari kayu",
  "Suka nonton pertunjukan tari tradisional",
  "Pecinta makanan Padang",
  "Hobi berkumpul di masjid",
  "Suka main gamelan",
  "Pecinta budaya Jawa",
  "Hobi membuat kerajinan dari tanah liat",
  "Suka nonton pertunjukan ludruk",
  "Pecinta makanan Manado",
  "Hobi berkebun buah-buahan",
  "Suka main kendang",
  "Pecinta lagu-lagu daerah",
  "Hobi membuat kerajinan dari rotan",
  "Suka nonton pertunjukan lenong",
  "Pecinta makanan Aceh",
  "Hobi berkumpul di balai desa",
  "Suka main suling",
  "Pecinta budaya Minang",
  "Hobi membuat kerajinan dari kulit",
];

// Long bio templates for complex data
const longBioTemplates = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
  "Nulla facilisi. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a nunc. Nam nec tellus a odio tincidunt auctor a ornare odio. Sed non mauris vitae erat consequat auctor eu in elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue. Sed non neque elit. Sed ut imperdiet nisi. Proin condimentum fermentum nunc. Etiam pharetra, erat sed fermentum feugiat, velit mauris egestas quam, ut aliquam massa nisl quis neque. Suspendisse in orci enim.",
  "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Proin eget tortor risus. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Nulla quis lorem ut libero malesuada feugiat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Proin eget tortor risus. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Nulla quis lorem ut libero malesuada feugiat.",
  "Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Nulla quis lorem ut libero malesuada feugiat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Proin eget tortor risus. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Nulla quis lorem ut libero malesuada feugiat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
];

const domains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "yandex.com",
];

const divisions = [
  "Tech",
  "QA",
  "HR",
  "Marketing",
  "Finance",
  "Sales",
  "Operations",
  "Legal",
  "Design",
  "Product",
];

const roles = ["admin", "user", "moderator", "editor", "viewer"];

const actions = [
  "login",
  "logout",
  "update_profile",
  "create_user",
  "delete_user",
  "view_users",
  "export_data",
];

function generateRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generateLongBio() {
  const template =
    longBioTemplates[Math.floor(Math.random() * longBioTemplates.length)];
  // Add some variation to make it more realistic
  const variations = [
    " Selain itu, saya juga suka berkebun dan memasak.",
    " Di waktu luang, saya sering membaca buku dan menonton film.",
    " Saya aktif di komunitas lokal dan sering mengikuti kegiatan sosial.",
    " Hobi saya adalah traveling dan fotografi.",
    " Saya suka belajar hal-hal baru dan mengikuti perkembangan teknologi.",
  ];
  return template + variations[Math.floor(Math.random() * variations.length)];
}

function generateProfileJson() {
  const profileTypes = [
    {
      social_media: {
        instagram: `user_${Math.floor(Math.random() * 9999)}`,
        twitter: `@user_${Math.floor(Math.random() * 9999)}`,
        linkedin: `user-${Math.floor(Math.random() * 9999)}`,
      },
      preferences: {
        theme: Math.random() > 0.5 ? "dark" : "light",
        language: "id",
        notifications: Math.random() > 0.5,
      },
      skills: ["JavaScript", "React", "Node.js", "PostgreSQL"],
      interests: ["Technology", "Music", "Sports", "Travel"],
    },
    {
      contact_info: {
        emergency_contact: `+62${
          Math.floor(Math.random() * 900000000) + 100000000
        }`,
        address: {
          street: `Jl. ${
            ["Mangga", "Jeruk", "Apel", "Pisang"][Math.floor(Math.random() * 4)]
          } No. ${Math.floor(Math.random() * 100) + 1}`,
          city: ["Jakarta", "Bandung", "Surabaya", "Medan", "Semarang"][
            Math.floor(Math.random() * 5)
          ],
          postal_code: Math.floor(Math.random() * 90000) + 10000,
        },
      },
      work_info: {
        department: divisions[Math.floor(Math.random() * divisions.length)],
        position: ["Junior", "Senior", "Lead", "Manager"][
          Math.floor(Math.random() * 4)
        ],
        join_date: generateRandomDate(new Date(2015, 0, 1), new Date())
          .toISOString()
          .split("T")[0],
      },
    },
    {
      personal_data: {
        nationality: "Indonesian",
        religion: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha"][
          Math.floor(Math.random() * 5)
        ],
        marital_status: Math.random() > 0.5 ? "single" : "married",
        children: Math.floor(Math.random() * 4),
      },
      education: {
        degree: ["S1", "S2", "S3", "D3"][Math.floor(Math.random() * 4)],
        major: ["Computer Science", "Engineering", "Business", "Arts"][
          Math.floor(Math.random() * 4)
        ],
        university: ["UI", "ITB", "UGM", "IPB", "ITS"][
          Math.floor(Math.random() * 5)
        ],
      },
    },
  ];

  return profileTypes[Math.floor(Math.random() * profileTypes.length)];
}

function generateIndonesianUser(index) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale
    ? indonesianNames.male[
        Math.floor(Math.random() * indonesianNames.male.length)
      ]
    : indonesianNames.female[
        Math.floor(Math.random() * indonesianNames.female.length)
      ];

  const lastName =
    indonesianNames.surnames[
      Math.floor(Math.random() * indonesianNames.surnames.length)
    ];
  const fullName = `${firstName} ${lastName}`;

  // Make username more unique by adding index and random number
  const username = `${firstName.toLowerCase()}${index}${Math.floor(
    Math.random() * 9999
  )}`;
  const email = `${username}@${
    domains[Math.floor(Math.random() * domains.length)]
  }`;

  // All users have password: User123@
  const password = "User123@";

  const birthDate = generateRandomDate(
    new Date(1960, 0, 1),
    new Date(2005, 11, 31)
  );

  const bio = indonesianBios[Math.floor(Math.random() * indonesianBios.length)];
  const longBio = generateLongBio();
  const profileJson = generateProfileJson();

  // Generate phone number
  const phoneNumber = `+62${Math.floor(Math.random() * 900000000) + 100000000}`;

  // Generate address
  const cities = [
    "Jakarta",
    "Bandung",
    "Surabaya",
    "Medan",
    "Semarang",
    "Yogyakarta",
    "Malang",
    "Palembang",
  ];
  const address = `Jl. ${
    ["Mangga", "Jeruk", "Apel", "Pisang", "Anggur", "Nanas"][
      Math.floor(Math.random() * 6)
    ]
  } No. ${Math.floor(Math.random() * 100) + 1}, ${
    cities[Math.floor(Math.random() * cities.length)]
  }`;

  return {
    username,
    fullName,
    email,
    password,
    birthDate: birthDate.toISOString().split("T")[0],
    bio,
    longBio,
    profileJson,
    phoneNumber,
    address,
  };
}

async function createDatabase() {
  console.time("Database Creation");

  try {
    // Step 1: Check if database exists and handle gracefully
    console.log("🔍 Checking if database exists...");
    let databaseExists = false;

    try {
      const result = await initialPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        ["workshop_db"]
      );
      databaseExists = result.rows.length > 0;

      if (databaseExists) {
        console.log(
          "✅ Database workshop_db already exists - proceeding with table creation and seeding"
        );
      } else {
        console.log("📝 Creating database workshop_db...");
        await initialPool.query("CREATE DATABASE workshop_db");
        console.log("✅ Database workshop_db created successfully");
      }
    } catch (error) {
      console.log("📝 Creating database workshop_db...");
      await initialPool.query("CREATE DATABASE workshop_db");
      console.log("✅ Database workshop_db created successfully");
    }

    // Close initial pool and use workshop pool
    await initialPool.end();

    // Step 2: Create auth table
    console.log("📋 Creating auth table...");
    const createAuthTableQuery = `
      CREATE TABLE IF NOT EXISTS auth (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createAuthTableQuery);
    console.log("✅ Auth table created/verified");

    // Step 3: Create users table (updated structure)
    console.log("📋 Creating users table...");
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth_id INTEGER REFERENCES auth(id),
        full_name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        birth_date DATE,
        bio TEXT,
        long_bio TEXT,
        profile_json JSON,
        address TEXT,
        phone_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUsersTableQuery);
    console.log("✅ Users table created/verified");

    // Step 4: Create user_roles table
    console.log("📋 Creating user_roles table...");
    const createUserRolesTableQuery = `
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUserRolesTableQuery);
    console.log("✅ User roles table created/verified");

    // Step 5: Create user_logs table
    console.log("📋 Creating user_logs table...");
    const createUserLogsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUserLogsTableQuery);
    console.log("✅ User logs table created/verified");

    // Step 6: Create user_divisions table
    console.log("📋 Creating user_divisions table...");
    const createUserDivisionsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_divisions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        division_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUserDivisionsTableQuery);
    console.log("✅ User divisions table created/verified");

    // Step 7: Clear existing data
    console.log("🧹 Clearing existing data...");
    await workshopPool.query("DELETE FROM user_divisions");
    await workshopPool.query("DELETE FROM user_logs");
    await workshopPool.query("DELETE FROM user_roles");
    await workshopPool.query("DELETE FROM users");
    await workshopPool.query("DELETE FROM auth");
    console.log("✅ Cleared existing data");

    // Step 8: Generate and insert 1000 users
    console.log("👥 Generating 1000 Indonesian users...");
    const users = [];
    for (let i = 0; i < 1000; i++) {
      users.push(generateIndonesianUser(i));
    }

    // Step 9: Insert auth records first
    console.log("💾 Inserting auth records...");
    const authInsertQuery = `
      INSERT INTO auth (email, password)
      VALUES ($1, $2)
      RETURNING id
    `;

    const authIds = [];
    for (const user of users) {
      const passwordHash = hashPassword(user.password);
      const result = await workshopPool.query(authInsertQuery, [
        user.email,
        passwordHash,
      ]);
      authIds.push(result.rows[0].id);
    }

    // Step 10: Insert users with auth_id reference
    console.log("💾 Inserting users...");
    const userInsertQuery = `
      INSERT INTO users (auth_id, full_name, username, birth_date, bio, long_bio, profile_json, address, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const userIds = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Add NULL and DUPLICATE variations for testing
      let bio = user.bio;
      let address = user.address;
      let phoneNumber = user.phoneNumber;
      let profileJson = user.profileJson;

      // Randomly set some fields to NULL (10% chance)
      if (Math.random() < 0.1) bio = null;
      if (Math.random() < 0.1) address = null;
      if (Math.random() < 0.1) phoneNumber = null;
      if (Math.random() < 0.1) profileJson = null;

      // Randomly duplicate some data (5% chance)
      if (Math.random() < 0.05 && i > 0) {
        bio = users[i - 1].bio;
        address = users[i - 1].address;
        phoneNumber = users[i - 1].phoneNumber;
        profileJson = users[i - 1].profileJson;
      }

      const result = await workshopPool.query(userInsertQuery, [
        authIds[i],
        user.fullName,
        user.username,
        user.birthDate,
        bio,
        user.longBio,
        JSON.stringify(profileJson),
        address,
        phoneNumber,
      ]);
      userIds.push(result.rows[0].id);
    }

    // Step 11: Insert user roles
    console.log("💾 Inserting user roles...");
    const roleInsertQuery = `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, $2)
    `;

    for (let i = 0; i < userIds.length; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      await workshopPool.query(roleInsertQuery, [userIds[i], role]);
    }

    // Step 12: Insert user divisions
    console.log("💾 Inserting user divisions...");
    const divisionInsertQuery = `
      INSERT INTO user_divisions (user_id, division_name)
      VALUES ($1, $2)
    `;

    for (let i = 0; i < userIds.length; i++) {
      const division = divisions[Math.floor(Math.random() * divisions.length)];
      await workshopPool.query(divisionInsertQuery, [userIds[i], division]);
    }

    // Step 13: Insert user logs
    console.log("💾 Inserting user logs...");

    for (let i = 0; i < userIds.length; i++) {
      // Generate 1-5 random logs per user
      const logCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < logCount; j++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const randomDate = generateRandomDate(new Date(2023, 0, 1), new Date());

        await workshopPool.query(
          `
          INSERT INTO user_logs (user_id, action, created_at)
          VALUES ($1, $2, $3)
        `,
          [userIds[i], action, randomDate]
        );
      }
    }

    console.log(`✅ Successfully seeded ${users.length} Indonesian users`);
    console.log("✅ All users have password: User123@");
    console.log("✅ Database structure updated for sessions 11 & 12");
    console.log("✅ Added NULL and DUPLICATE variations for testing");
    console.log("✅ Database setup completed successfully!");
    console.timeEnd("Database Creation");
  } catch (error) {
    console.error("❌ Database creation error:", error);
    console.timeEnd("Database Creation");
    process.exit(1);
  } finally {
    await workshopPool.end();
  }
}

// Run the database creation
createDatabase();
