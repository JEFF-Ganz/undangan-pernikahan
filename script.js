// -----------------------------------------------------------------
// 📋 LANGKAH 1: KONFIGURASI FIREBASE (GANTI DENGAN KONFIG ANDA!)
// -----------------------------------------------------------------
// DAPATKAN KODE INI DARI FIREBASE CONSOLE -> PROJECT SETTINGS
const firebaseConfig = {
  apiKey: "AIzaSyCta1ZZZkX-GkJOWWSdDW3devFCle7h-l4",
  authDomain: "undangan-pernikahan-b7a8d.firebaseapp.com",
  projectId: "undangan-pernikahan-b7a8d",
  storageBucket: "undangan-pernikahan-b7a8d.firebasestorage.app",
  messagingSenderId: "677237645480",
  appId: "1:677237645480:web:b9891519e185813851229d"
};

let db = null;
let firebaseInitialized = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  firebaseInitialized = true;
  console.log("✅ Firebase berhasil terhubung!");
} catch (error) {
  console.error("❌ Error Firebase:", error);
  alert("Periksa konfigurasi Firebase!");
}


// --- 2. Welcome Screen & Audio Logic ---
const btnOpen = document.getElementById('btn-open');
const welcomeOverlay = document.getElementById('welcome-overlay');
const bgMusic = document.getElementById('bg-music');

const openInvitation = () => {
  welcomeOverlay.classList.add('hidden');
  bgMusic.play().catch(e => console.log("Autoplay blocked."));
  document.body.style.overflow = 'auto';
  
  // Trigger animations for the first section
  reveal();
};

if (btnOpen) {
  btnOpen.addEventListener('click', openInvitation);
}

// Initially lock scroll
document.body.style.overflow = 'hidden';


// --- 3. Reveal on Scroll Logic ---
function reveal() {
  const reveals = document.querySelectorAll(".reveal");
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    const elementVisible = 150;
    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }
  }
}

window.addEventListener("scroll", reveal);


// --- 4. Countdown Timer ---
const targetDate = new Date("Jun 21, 2026 09:00:00").getTime();

const updateCountdown = () => {
  const now = new Date().getTime();
  const distance = targetDate - now;

  if (distance < 0) {
    document.getElementById('countdown').innerHTML = "ACARA SEDANG BERLANGSUNG";
    return;
  }

  const d = Math.floor(distance / (1000 * 60 * 60 * 24));
  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById('days').innerText = d.toString().padStart(2, '0');
  document.getElementById('hours').innerText = h.toString().padStart(2, '0');
  document.getElementById('minutes').innerText = m.toString().padStart(2, '0');
  document.getElementById('seconds').innerText = s.toString().padStart(2, '0');
};

setInterval(updateCountdown, 1000);
updateCountdown();


// --- 5. Gallery Interaction ---
const marquee = document.getElementById('marquee');
if (marquee) {
  marquee.addEventListener('click', () => {
    marquee.classList.toggle('paused');
  });
}


// -----------------------------------------------------------------
// 💍 BAGIAN FIREBASE INTEGRATION: RSVP & GUESTBOOK
// -----------------------------------------------------------------
const rsvpForm = document.getElementById('form-rsvp');
const guestbookContainer = document.getElementById('guestbook-container');

// -----------------------------------------------------------------
// FUNGSI: MENYIMPAN RSVP KE FIREBASE
// -----------------------------------------------------------------
if (rsvpForm) {
  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Jika Firebase belum siap, gunakan mode offline (mockup)
    if (!firebaseInitialized || !db) {
      alert('Firebase belum dikonfigurasi! Pesan disimpan secara lokal.');
      // Mockup render
      const name = document.getElementById('name').value;
      const attendance = document.getElementById('attendance').value;
      const message = document.getElementById('message').value;
      const card = document.createElement('div');
      card.style.cssText = "background: #f9f9f9; padding: 15px; margin-top: 10px; border-left: 4px solid #D4AF37;";
      card.innerHTML = `
          <strong>${name}</strong> <small>(${attendance})</small>
          <p>${message}</p>
      `;
      guestbookContainer.prepend(card);
      rsvpForm.reset();
      return;
    }
    
    // Ambil nilai dari form
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('guests').value; // Ini jumlah tamu
    const attendance = document.getElementById('attendance').value;
    const message = document.getElementById('message').value.trim();

    // Validasi: nama tidak boleh kosong
    if (!name || !attendance) {
      alert('Mohon isi nama dan konfirmasi kehadiran!');
      return;
    }

    try {
      // Simpan ke collection "rsvp" di Firestore
      await db.collection("rsvp").add({
        name: name,
        phone: phone,
        attendance: attendance,
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Waktu server
      });

      // Juga simpan ke "guestbook" untuk ditampilkan
      await db.collection("guestbook").add({
        name: name,
        message: message,
        attendance: attendance,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Reset form dan tampilkan pesan sukses
      rsvpForm.reset();
      alert('Terima kasih atas konfirmasi dan doanya!');

    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengirim. Coba lagi!');
    }
  });
}


// -----------------------------------------------------------------
// FUNGSI: MENAMPILKAN GUESTBOOK SECARA REAL-TIME
// -----------------------------------------------------------------
if (guestbookContainer) {
  // Jika Firebase tidak siap, kosongkan container
  if (!firebaseInitialized || !db) {
    guestbookContainer.innerHTML = `
        <p style="text-align:center; color:#666; font-style:italic; padding:30px;">
            Silakan konfigurasi Firebase untuk melihat guestbook!
        </p>
    `;
  } else {
    // Mendengarkan perubahan di collection "guestbook"
    db.collection("guestbook")
      .orderBy("timestamp", "desc") // Urutkan dari yang terbaru
      .limit(50) // Batasi 50 pesan
      .onSnapshot((querySnapshot) => {
        guestbookContainer.innerHTML = ''; // Kosongkan container terlebih dahulu
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Buat elemen card
          const card = document.createElement('div');
          card.className = 'comment-card';
          // Format tanggal/waktu
          const date = data.timestamp ? data.timestamp.toDate() : null;
          const dateString = date ? date.toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
          }) : '';
          
          card.innerHTML = `
              <div class="guest-header" style="display:flex;justify-content:space-between;align-items:center;">
                  <strong style="font-family: 'Playfair Display', serif; color: #5C001E; font-size: 1.1rem;">
                      ${data.name}
                  </strong>
                  <small style="font-family: 'Montserrat', sans-serif; color: #666; text-transform: uppercase; font-size: 0.7rem;">
                      ${dateString}
                  </small>
              </div>
              <p style="margin-top: 10px; color: #2d2d2d; line-height: 1.6; font-style: italic;">
                  ${data.message}
              </p>
              ${data.attendance ? `
                  <span style="display:inline-block;margin-top:8px;padding:4px 12px; background: rgba(212, 175, 55, 0.15);
                      color: #5C001E; border-radius: 4px; font-family: 'Montserrat', sans-serif;
                      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">
                      ${data.attendance === 'Hadir' ? 'Berencana Hadir' : 'Tidak Bisa Hadir'}
                  </span>
              ` : ''}
          `;
          guestbookContainer.appendChild(card);
        });
      }, (error) => {
        console.error("Error load guestbook:", error);
        guestbookContainer.innerHTML = `
            <p style="text-align:center; color:#666; font-style:italic; padding:30px;">
                Gagal memuat pesan. Periksa Firestore Rules!
            </p>
        `;
      });
  }
}
