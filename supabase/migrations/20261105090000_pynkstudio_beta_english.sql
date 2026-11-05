-- Beta program in inglese: testi facoltativi (ricadono sull'italiano). La nota dei canali
-- vive nel JSON `channels` come `notesEn`; la lingua del tester usa la colonna `locale` esistente.
alter table public.pynkstudio_betas
  add column if not exists tagline_en text,
  add column if not exists description_en text;

-- La beta oggi aperta, così la pagina inglese non mostra testi italiani.
update public.pynkstudio_betas
set
  tagline_en = 'The 2-to-16 player party game with an AI host',
  description_en = E'The first Android beta of Are You Stupid?!: your phone is the controller, the TV or computer is the board.\n\nWhat to test: creating a room, players joining, full matches and the AI host.',
  channels = (
    select coalesce(jsonb_agg(
      case
        when c ->> 'notes' like 'Usa sempre lo stesso account Google%'
          then c || jsonb_build_object('notesEn', 'Always use the same Google account in all three steps: the one you use for the Play Store on your device. After installing, keep the app on your phone for at least 14 days.')
        else c
      end
      order by ord
    ), '[]'::jsonb)
    from jsonb_array_elements(channels) with ordinality as t(c, ord)
  )
where name = 'Are You Stupid?!';
