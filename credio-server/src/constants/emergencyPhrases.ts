type EmergencyPhrase = {
    [key: string]: string
    evacuate_now: string
    seek_shelter: string
    stay_indoors: string
    move_higher_ground: string
    call_emergency: string
    do_not_panic: string
    avoid_floodwater: string
    drop_cover_hold: string
}

type EmergencyPhrasesType = {
    [key: string]: EmergencyPhrase
}

export const EMERGENCY_PHRASES: EmergencyPhrasesType = {
    en: {
        evacuate_now: "Evacuate immediately!",
        seek_shelter: "Seek shelter now!",
        stay_indoors: "Stay indoors and away from windows.",
        move_higher_ground: "Move to higher ground immediately.",
        call_emergency: "Call emergency services: 911",
        do_not_panic: "Stay calm and follow instructions.",
        avoid_floodwater: "Never enter floodwater.",
        drop_cover_hold: "Drop, Cover, and Hold On!",
    },
    es: {
        evacuate_now: "¡Evacúe inmediatamente!",
        seek_shelter: "¡Busque refugio ahora!",
        stay_indoors: "Permanezca en el interior y lejos de las ventanas.",
        move_higher_ground: "Muévase a terreno más alto inmediatamente.",
        call_emergency: "Llame a servicios de emergencia: 911",
        do_not_panic: "Mantenga la calma y siga las instrucciones.",
        avoid_floodwater: "Nunca entre en agua de inundación.",
        drop_cover_hold: "¡Agáchese, Cúbrase y Agárrese!",
    },
    hi: {
        evacuate_now: "तुरंत निकलें!",
        seek_shelter: "अभी आश्रय लें!",
        stay_indoors: "घर के अंदर रहें और खिड़कियों से दूर रहें।",
        move_higher_ground: "तुरंत ऊंची जगह पर जाएं।",
        call_emergency: "आपातकालीन सेवाओं को कॉल करें: 112",
        do_not_panic: "शांत रहें और निर्देशों का पालन करें।",
        avoid_floodwater: "कभी भी बाढ़ के पानी में न जाएं।",
        drop_cover_hold: "झुकें, ढकें और पकड़ें!",
    },
    ar: {
        evacuate_now: "!اخلِ فوراً",
        seek_shelter: "!ابحث عن مأوى الآن",
        stay_indoors: ".ابق في الداخل وبعيداً عن النوافذ",
        move_higher_ground: ".انتقل إلى أرض مرتفعة فوراً",
        call_emergency: "911 :اتصل بخدمات الطوارئ",
        do_not_panic: ".ابق هادئاً واتبع التعليمات",
        avoid_floodwater: ".لا تدخل مياه الفيضان أبداً",
        drop_cover_hold: "!انخفض، احتمِ، وامسك",
    },
    fr: {
        evacuate_now: "Évacuez immédiatement !",
        seek_shelter: "Cherchez un abri maintenant !",
        stay_indoors: "Restez à l'intérieur et loin des fenêtres.",
        move_higher_ground: "Déplacez-vous vers un terrain plus élevé immédiatement.",
        call_emergency: "Appelez les services d'urgence : 112",
        do_not_panic: "Restez calme et suivez les instructions.",
        avoid_floodwater: "N'entrez jamais dans les eaux de crue.",
        drop_cover_hold: "Baissez-vous, Couvrez-vous et Tenez bon !",
    },
    zh: {
        evacuate_now: "立即撤离!",
        seek_shelter: "立即寻找庇护所!",
        stay_indoors: "待在室内并远离窗户。",
        move_higher_ground: "立即移动到高地。",
        call_emergency: "拨打紧急服务电话: 110",
        do_not_panic: "保持冷静并遵循指示。",
        avoid_floodwater: "绝不要进入洪水。",
        drop_cover_hold: "蹲下、掩护、抓牢!",
    },
    ja: {
        evacuate_now: "直ちに避難してください!",
        seek_shelter: "今すぐ避難所を探してください!",
        stay_indoors: "屋内にとどまり、窓から離れてください。",
        move_higher_ground: "直ちに高台に移動してください。",
        call_emergency: "緊急サービスに電話してください: 110",
        do_not_panic: "落ち着いて指示に従ってください。",
        avoid_floodwater: "絶対に洪水に入らないでください。",
        drop_cover_hold: "しゃがむ、隠れる、じっとする!",
    },
    pt: {
        evacuate_now: "Evacue imediatamente!",
        seek_shelter: "Procure abrigo agora!",
        stay_indoors: "Fique dentro de casa e longe das janelas.",
        move_higher_ground: "Mova-se para terreno mais alto imediatamente.",
        call_emergency: "Ligue para os serviços de emergência: 190",
        do_not_panic: "Mantenha a calma e siga as instruções.",
        avoid_floodwater: "Nunca entre em água de enchente.",
        drop_cover_hold: "Abaixe-se, Cubra-se e Segure-se!",
    },
}

export function getCachedPhrase(
    phraseKey: string,
    lang: string
): string | null {
    return EMERGENCY_PHRASES[lang]?.[phraseKey] || null
}
