import { typography } from '../../utils/typography';

export const FORM_CONTROL_HEIGHT = 'h-11';

export const formInputClass =
  `w-full ${FORM_CONTROL_HEIGHT} px-3 ${typography.body} text-[#1b1c19] bg-white ` +
  'border border-[rgba(196,198,207,0.55)] rounded-xl placeholder-[#74777f] ' +
  'focus:outline-none focus:border-[#022448] focus:ring-2 focus:ring-[#022448]/20 transition-colors';

export const formTextareaClass =
  'w-full min-h-[4.5rem] px-3 py-2.5 text-body text-[#1b1c19] bg-white ' +
  'border border-[rgba(196,198,207,0.55)] rounded-xl placeholder-[#74777f] resize-none ' +
  'focus:outline-none focus:border-[#022448] focus:ring-2 focus:ring-[#022448]/20 transition-colors';

export const formLabelClass = `${typography.label} mb-1.5 block`;

export const formFooterCancelClass =
  `flex-1 ${FORM_CONTROL_HEIGHT} px-4 rounded-xl ${typography.button} ` +
  'bg-white border border-[rgba(196,198,207,0.55)] text-[#43474e] ' +
  'hover:bg-[#fbf9f3] focus:outline-none focus:ring-2 focus:ring-[#022448]/20 transition-colors';

export const formFooterPrimaryClass =
  `flex-1 ${FORM_CONTROL_HEIGHT} px-4 rounded-xl ${typography.button} ` +
  'bg-[#022448] text-white hover:bg-[#1a3558] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#022448] focus:ring-offset-2 transition-colors';
