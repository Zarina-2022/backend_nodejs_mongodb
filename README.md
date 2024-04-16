# Komutlar

## Kollekisyonlardaki bütün verileri temizle

`node ./dev-data/data/dev-commands.js --delete`

## Kollekisyonlara hazır verileri ekle

`node ./dev-data/data/dev-commands.js --import`

# MongoDB Operatörler

- gt > greater than ">"
- gte > greater than or equeals ">="
- lt > less than "<"
- lte > less than or equeals "<="
- ne > not equals "!="

# Authentication (Kimlik Doğrulama)

- Bir kullanıcın kimliğini doğrulamak için geçtiği süreçtir.
- Ör: e posta şifre / google hesabı / parmak izi
- Kimlik doğrulama, bir kullanıcının sisteme erişim talebini gerçekleştiren ilk adımdır.

# Authorization (Yetkilendirme)

- Bir kullanıcnın sistemeizin belirli kaynaklarına erişiminin kontrol etme sürecididr.
- Yetkilendirme kimklik doğrulama sürecinin ardından devreye girer.
- Kimliğini doğruladığımız kullanıcın ne tür eylermleri gerçekleştirebileceğini belirler.
- Ör:
- - kullanıncın oturmu açıksa bazı işlevleri erişebilirken kapalıysa erişemez
- - user rolü sadece okuma yapabilir.
- - guide ve lead-guide rolü saedece kendi oluşturdukları turlarda crud işlemi yapabilir.
- - admin rolü bütün turlarda crud işlemleri yapabilir.

# Hashing

## Temel Özellikleri

1. Benzersizlik: Farklı girdiler farklı hash değerleri üretir. Aynı girdiler de aynı hash değerini üretir

2. Hızlı İşleme

3. Sabit Boyulu Çıktı: Girdinin uzunluğundan bağımsız sabit uzunlukta çıktı verir

4. Parola Güvenliğ: Kullanıcı parollarının hashlenmesi parolanın deplonması sırasında güvenliği arttr. Böylece depolama alınan erişen bir saldırgan kullanıclarının gerçek şifrelerini göremez

# Saltlama

Parola tabanlı hash fonksiyonları aynı girdiler aynı sonuçları ürettikleri için saltlama ile birlik te güvenliği arttırırz. Saltama kullanıcnın parolaso için rasgele bir değer oluşturur ve bu değeri parolanın kendisiyle birleştirir. Sonra bu salt'nmış parola hashing algoritmasından geçer bu sayede hash aybı parola için farklı sonuçlar üretir

## Normal

Denem@123

## 1. Hashlenmiş ve Saltlanmış

$2b$12$B3sHw1fY2MNQy0rFU.AmO.vvBdbnmyHD/NFQlYeBs5w5fxh2tzcfe

## 2. Hashlenmiş ve Saltlanmış

$2b$12$/DWrKJ412jEp11rnh7iMBOGbOA7vmxHJrEq4Pxw10rQJ5CF9S/Kxa

## 3.Hashlenmiş ve Saltlanmış

$2b$12$VqkcTRKPzyQubPBjuBhW.uEiBEco00y.7ozZBQd5b5aFv7qCdmnwG

# JWT (JSON Web Token)

Veri aktarımı için kullanılan kompakt, kendine yaten güvenli bir veri formatıdır.
Özellikle web uygulamların kimlik doğrulaması ve pturum yönetimi gibi alnlarda popülerdir.
Neden kullanılıyor

1. Taşınabailirlik: JWT, istemci ve sunucu arasında taşınabilir bir veri format.

2. Kendine Yetrlilik: Kullanıcı bilgilerini taşırken bu bilgilerin doğrulanmasını sağlayacak tüm bilgileri içeriir. Bu sunucun bir veri depolamay gerek duymadan doğrulama yapmasını sağlar ve bu sayede gerkesiz sorguların önüne geçeriz.

3. Güvenlik: JWT'ler dijital imza gibi yöntemlerle güvenli bir şekilde imzalanabilir. Bu jwt'nin değiştirlmediğini ve güvenli bir şekilde taşındığını doğrular

# Güvenlik Paketleri

- `express-rate-limit`: aynı ip adresinden gelen istekleri sınırlar
- `helmet`: güvenlik header'ları ekler
- `express-mongo-sanitize`: body/aparm ile enejekte edilemey çalışılan komutları bozar
- `xss clean`: html içerisnde enjekte eidlmeye çalışan kötü amaçlıi scriptlere yakalar ve bozar
- `hpp`: parametre kirliliğini önler

# Data Modeling

Data modelling, bir biligi sisteminde kullanılan veir yapılarının, kısıtlamalarını ilişkilerini ve diğer önemli unuslarları tanımladığımız sürece verdiğimiz isimdir. Bu süreç projenin ihtiyaçlarını karşılama adına veritabanı tasarımını planlamak için kullanılır. Amaçı karmaşik veri setlerini daha anlışılabilir, düzenli erişilebilir bir şeklikde organiz etmek için kullanılan bir süreçtir.

# Veri Modelleme Süreci

1. Gereksinimleri Belirle

2. Kavramsal Belirleme

3. Fiziksel Modelleme

4. Uygulama Geliştirme

# Veriler Arasında Kurulan İlişkiler

- Veriler arasında farklı türlerde ilişkiler kurulabilir

1. Referancing (Referans) / Normalization

- Tanım: Referans, belirli belgedeki verileri başka bir belgeye referanslar kullanarak ilişkilendirmeye yarar. Yani, iki belge arasında ilişki vardır, ancak geçek veri bir belgede saklanırklen diğer belgede sadce gerçek verinin referansı bulunur

2. Embedding (Gömme) / Denormalization:

- Tanım: Belirli bir belgenin içerisndeki diğer belgeri duğrudan gömülü olarak tanımlaya yarar

---

`user document` = {
id:58,
name:"Ahmet",
surname:"Yıldız":
phone:5446789223
}

## Referans Örneği

`comment document` = {
id:146,
text:"Bu hizmetten çok memnun kaldım",
createdAt:23.09.2023,
user_id:58
}

# Embeding Örneği

`comment document` = {
id:146,
text:"Bu hizmetten çok memnun kaldım",
createdAt:23.09.2023,
user:{
id:58,
name:"Ahmet",
surname:"Yıldız":
phone:5446789223
}
}

# Verilerin birbiri arasındaki ilişki türleri

- 1:1 (One To One): Bu ilişki türünde, bir kollekisyondaki döküman farklı kolleksiyondaki sadece bir dökümanla bağlantı kurabilir

- 1:Many (One To Many): Bu ilişki türünde, bir kollekisyondaki döküman diğer kolleksiyondaki birden fazla döküman ile eşleşelebilir.

- Many:Many (Many Many): Bu ilişki türünde, bir kolleksiyondaki birden çok döküman farklı kollleksiyondaki bir den çok dökümanla ilişkiye sahip olabilir

# Hangi Durumlarda Embeddibg Hangi Durumda Refferencing Kullanılır?

                        Embedding                                    Refferencing

1. İlişki Tipi: 1:Few, 1:Many 1:Many, 1:Ton, Many:Many

2. Erişim Durumu: Okuma daha yüksekse Veri çok güncelleniyorsa
   Veri Çok değişmiyorsa Düşük (Okuma / Yazma) Oranı  
   Yüksek (Okuma/Yazma) oranı

3. Yakınlık Durumu: Dökümanlar birbiri ile çok alakalı Bazı durumlarda birlikte alınması
   gerekir bazen tek tek de değerlendilir

# Referans Tipleri

1. Child Refferance (Çocuk Referansı):
2. Parent Refferance (Ebevyn Referansı):
3. TwoWay Refferance (Ebevyn Referansı):

# Populate

- Farklı kolleksiyonlar arasında oluşturulan ilişkilerde veriye erişmek için sorgularda kullanılan bir method. Populate, dökümanın içeriende referans olarak tanımlanmış bir alanı id'den yola çıkarak asıl kolleksiyondaki ilgili veriye erişir ve referans olarak tanımlanan id değerini değerinin yerine dökümanın verilerini getirir





//========================

marina => marina@gmail.com => Marina@123
