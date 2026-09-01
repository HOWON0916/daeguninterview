export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { dept, sampleFormat, studentData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
  }

  if (!studentData) {
    return res.status(400).json({ error: '학생 생활기록부 내용을 입력해주세요.' });
  }

  const promptText = `당신은 대학교 학생부종합전형 수시 면접관(입학사정관)입니다.
아래 지원 학과와 학생부 기록을 바탕으로 실제 면접에서 활용할 날카로운 검증 질문을 만들어주세요.

[작성 지침]
1. 아래 [기출 예시 및 형식]의 질문 구성(메인 질문 + 심층 꼬리질문) 및 어조를 그대로 따르세요.
2. 학생부 본문에 나온 구체적인 활동명, 탐구 보고서 제목, 개념을 질문에 직접 언급하세요.
3. 질문마다 [평가 의도/포인트]를 한 줄로 덧붙여주세요.

[지원 학과]: ${dept || '일반 전공'}

[기출 예시 및 형식]:
${sampleFormat || '메인 질문과 후속 꼬리질문 형태'}

[학생 생활기록부]:
${studentData}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    const resultText = data.candidates[0]?.content?.parts[0]?.text || '응답을 생성하지 못했습니다.';
    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다: ' + error.message });
  }
}