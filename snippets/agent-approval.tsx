/**
 * agent-approval — Geri alinamaz aksiyonlar icin onay (Human-in-the-Loop)
 *
 * Agent kritik bir isleme geldiginde durur ve kullaniciya sorar. Bu hook'ta
 * (useHumanInTheLoop) soru, SONUCU OLMAYAN bir frontend tool cagrisidir: run
 * temizce biter, kullanicinin cevabi bir SONRAKI run'a o cagrinin TOOL SONUCU
 * olarak girer ({"optionId":"accept"}). `resume` gondermez; AG-UI'in standart
 * interrupt'i (RUN_FINISHED outcome) baska bir yol, onu `useInterrupt` tuketir.
 * Duraklatilmis baglanti yok — stateless HTTP'ye oturan bir model.
 *
 * Geri ALINABILIR aksiyonlarda bunu kullanma -> snippets/action-card.tsx
 * Kirmizi cizgilerde (hesap silme) hicbirini kullanma -> tool'u agent'a verme.
 *
 * SUNUCU AYAGI (asil kapi orada): geri alinamaz isi yalnizca BU toolCallId'nin
 * tool sonucu kati bicimde { optionId: 'accept' } cozuldugunde yap; ucus id'sini
 * modelin yeni bir cagrisindan degil AYNI cagrinin argumanlarindan al ve ucusun
 * oturumdaki kullaniciya ait oldugunu dogrula (rules/agentic-ui.md 1, 2). Daha
 * siki secenek: iptali kullanicinin tikinda yeniden yetkilendiren bir sunucu
 * eylemi yapsin, model yalnizca sonucu ogrensin.
 *
 * Kullanim:
 *   function TicketingApprovals() {
 *     useCancelFlightApproval()
 *     return null
 *   }
 *
 * Kural: rules/agentic-ui.md — 4 (aksiyon sinifina gore kontrol seviyesi)
 */

'use client'

import { m } from 'motion/react'
import { useHumanInTheLoop, ToolCallStatus } from '@copilotkit/react-core/v2'
import { z } from 'zod'

const EASE = [0.22, 1, 0.36, 1] as const

// MODEL YALNIZCA HEDEFI VE ACIKLAMAYI YAZAR. Dugme seti ve id -> anlam KODDA
// sabittir: args'i model yazar; secenekleri (id + etiket) de yazsaydi, prompt
// injection'a ugramis bir model 'accept' id'sini "Vazgec" etiketinin arkasina
// koyabilir ya da ret secenegini hic vermeyebilirdi — kullanicinin reddi onay
// olarak islenirdi. Soru metnini de model degil kod kurar (asagida), hedef
// kimligi dogrulanmis argumandan gelir.
const approvalParams = z.object({
  flightId: z.number().int().positive().describe('iptal edilecek ucusun id'),
  message: z.string().min(1).max(300).describe('kullaniciya kisa aciklama (neden iptal)'),
})

const OPTIONS = [
  { id: 'accept', label: 'İptal Et', danger: true },
  { id: 'decline', label: 'Vazgeç', danger: false },
] as const

const BUTTON = {
  danger: 'min-h-11 rounded-md bg-danger px-3 text-base text-on-primary transition hover:opacity-90',
  default: 'min-h-11 rounded-md border border-line-strong px-3 text-base text-body transition hover:bg-surface-raised',
}

export function useCancelFlightApproval() {
  useHumanInTheLoop(
    {
      name: 'cancelFlight',
      description:
        'Rezerve edilmis bir ucusu iptal etmek icin kullanicidan onay ister. ' +
        'Geri alinamaz; iptal yalnizca kullanici onaylarsa yapilir.',
      parameters: approvalParams,
      render: ({ status, args, respond }) => {
        // Executing = soru soruldu, cevap bekleniyor. respond SADECE burada var.
        if (status !== ToolCallStatus.Executing) {
          return (
            <p className="text-base text-muted">
              {status === ToolCallStatus.Complete ? 'Yanıtlandı.' : 'Hazırlanıyor…'}
            </p>
          )
        }

        // CopilotKit argumani SEMAYA KARSI DOGRULAMAZ (yalnizca JSON.parse) ->
        // rules/agentic-ui.md 5. Okunamayan istek KAPALI basarisiz olur: tek
        // cikis ret'tir, onaya giden dugme hic cizilmez.
        const parsed = approvalParams.safeParse(args)
        if (!parsed.success) {
          return (
            <div role="alert" className="rounded-lg border border-line bg-surface p-4">
              <p className="text-base text-body">Onay isteği okunamadı; işlem yapılmadı.</p>
              <button
                type="button"
                onClick={() => void respond({ optionId: 'decline' })}
                className={`mt-3 ${BUTTON.default}`}
              >
                Kapat
              </button>
            </div>
          )
        }

        const { flightId, message } = parsed.data

        return (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="rounded-lg border border-line bg-surface p-4"
          >
            <p className="font-mono text-micro uppercase tracking-[0.14em] text-muted">Geri Alınamaz</p>
            <p className="mt-1 text-base font-semibold text-strong">Uçuş #{flightId} iptal edilsin mi?</p>
            {/* Modelin metni yalnizca ikincil baglam: soruyu ve dugmeleri o yazmaz */}
            <p className="mt-1 text-small text-soft">{message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  // respond() cevabi bu cagrinin tool sonucu yapar ve YENI bir run
                  // baslatir. Yalnizca id gider; anlamini sunucu sabit eslemeyle cozer.
                  onClick={() => void respond({ optionId: option.id })}
                  className={option.danger ? BUTTON.danger : BUTTON.default}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </m.div>
        )
      },
    },
    [],
  )
}
