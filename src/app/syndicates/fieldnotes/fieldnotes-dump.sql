--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 15.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: field_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.field_values (
    id integer NOT NULL,
    field_id integer,
    note_id integer,
    value text
);


ALTER TABLE public.field_values OWNER TO postgres;

--
-- Name: field_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.field_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.field_values_id_seq OWNER TO postgres;

--
-- Name: field_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.field_values_id_seq OWNED BY public.field_values.id;


--
-- Name: fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fields (
    id integer NOT NULL,
    name text
);


ALTER TABLE public.fields OWNER TO postgres;

--
-- Name: fields_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fields_id_seq OWNER TO postgres;

--
-- Name: fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fields_id_seq OWNED BY public.fields.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    text text NOT NULL,
    emoji character varying(1),
    datetime timestamp with time zone
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notes_id_seq OWNER TO postgres;

--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sessions_id_seq OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: field_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_values ALTER COLUMN id SET DEFAULT nextval('public.field_values_id_seq'::regclass);


--
-- Name: fields id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fields ALTER COLUMN id SET DEFAULT nextval('public.fields_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: field_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.field_values (id, field_id, note_id, value) FROM stdin;
1	1	26	12/11
5	1	25	12/9
7	1	27	12/12
6	2	27	Science
9	3	27	River Valley Academy (alt ed), Rockford, MI
11	1	12	11/17
14	1	13	11/18
17	1	15	11/19
19	1	16	11/20
21	1	18	11/24
22	3	18	Kent City middle school
23	1	19	12/1
24	3	19	Sparta High School
25	2	19	Language Arts
26	1	20	12/2
27	3	20	East Rockford Middle School
28	2	20	Tracy Oullette (who I have subbed for before), Math 7
29	1	21	12/3
30	3	21	Mill Creek Middle School (Comstock Park)
31	2	21	ELL (English language learning) teacher
32	1	22	12/4
35	1	23	12/5
38	1	24	12/8
39	3	24	River Valley Academy (alternative education in Rockford)
42	4	19	Student 1 (Troubled Kid): Confided they aren't trying because they are passing (critical insight into threshold behavior). Later joked about needing to appear productive to avoid being yelled at (direct observation of superficial compliance).
43	5	19	Set clear expectations (quiet), wrote assignments, facilitated student transfers, proactively sought guidance from office/other teacher when the Focus class was handled.
45	7	19	Positive: Established control (1st hour). \n\nNegative: Low productivity in non-traditional classes. Major Risk/Anxiety: The interaction with the office/Focus teacher triggered anxiety about reputation/auditability ("I hope they're not angry at me/have heard anything bad about me from Kent City").
37	2	23	Autism Spectrum Disorder (ASD) day-long classroom
36	3	23	Sparta Middle School
2	2	26	Special Ed "Interventionist" teacher, teaching 6th & 7th grade math
40	3	25	Sparta Middle School
41	2	25	Special Ed "Interventionist" teacher, teaching 6th & 7th grade math
33	3	22	Sparta High School
34	2	22	Science
20	3	16	Kent City High School
18	3	15	Kent City High School & Middle School
15	3	13	Sparta Middle School
12	3	12	Kent City Middle School
44	6	19	To create a calm, productive learning environment (1st hour). To ensure all student needs were met and to check-in/be available (Focus).
59	1	28	12/15
60	3	28	Mill Creek Middle School 
61	2	28	Special Ed EI
\.


--
-- Data for Name: fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fields (id, name) FROM stdin;
1	When
2	Class
3	Where
4	Key Interactions
5	What I Did
6	Why I Did It
7	What Were the Effects
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notes (id, user_id, text, emoji, datetime) FROM stdin;
21	2	I've done this gig before with my vague memory of Spanish from high school and California (hablo un pocito de espanol). it went ok, so hopefully will again.\n\nhalf day this time presumably bc many of her classes were consulting in other classes to support Spanish speaking students.\n\nnope, supporting Spanish speaking students in classes the first few hours, then the newcomer class last hour. I went to 2nd half of 3rd hour because I got here early and helped Cruz, the primary target student pretty well.\n\nthen prep hour + lunch, without my laptop because I didn't think I'd have time to do work. so answer emails on my phone in a moment after my lunch heats up I'm the microwave.\n\nhad a good 5th hour supporting cruz in math (I definitely know uno, dos, tres, etc., and a bit of once, doce, ...). then 6th/last hour class was more about management, but most did a good job working. younger kid who recognized me was very nice given my spanglish.	\N	2025-12-03 15:18:19.855+00
12	2	The "innit" meme is dirty apparently, so don't mention it anymore. Other mistakes one of the girl students happened, too. So, avoid anything of substance? I also explained several things, including being aroace using the word “asexual”, and as "bored now" (ADHD).	\N	2025-12-01 00:37:45.535+00
20	2	1,2,3,6: simple correction of their homework using projected answer sheet. then a quiz with a misleading q2. then homework. many finished all 3, so they got restless \n\nmath lab (5) and RAM (both assisted work sessions) went very well.\n\n2nd hour, it was bc they got weights from under the teacher's desk to play with, so moving forward I hid them with my coat. 3 is much quieter after finishing homework.\n\n6: I let them play heads down thumbs up if they convinced everyone (esp those working), so hopefully I don't get in trouble.\n\nI also let a kid who finished all work use his computer, but another told me they should get in trouble for playing a game.\n\nanother red flag: laughing at my own attempts at wit still.	\N	2025-12-02 12:35:15.041+00
22	2	half day in the morning.\n\nhad a nice discussion with dad on the ride here about how I'm doing better at being a responsible adult vs trying to bond with students.\n\n1, bio: all assignments are on their chromebooks, starting with a quiz. so it's quite silent, yay. after they finished the quiz, they kept being productive and mostly silent -- a little chatting, but not much. yay again.\n\n2, honors chemistry: honors students are awesome. I specified rules and they all worked productively. teacher provided an answer key to one of the assignments (sigh).	\N	2025-12-04 13:17:30.784+00
13	2	I had 8th graders, so things went well given I didn't try to "be one of them" -- some were empathetic with/kind to me, so that was nice, but I had some success finding my middle ground between being an authority figure and connecting with them (to help them grow/live in a world that controls them/denies their reality)\n\nE4S PM workshop in Sparta was loud but they loved me. The Structural Supervisor mask (Detached Observer) was highly efficient for this kind of low-stakes environment.	\N	2025-12-01 00:37:51.919+00
18	2	I've been banned from all kent city schools, presumably due to my recent mistakes detailed before. maybe also my gig today with the teacher nearby, since I got released early, or maybe the principal told him about me.\n\nI removed my immediate Kent City gigs, but then EduStaff followed up: We want to inform you that Edustaff has received performance feedback regarding your assignment at Kent City Community Schools. This feedback includes:\n \nAwkward/inappropriate learning at girls. \nClassroom management. \nInappropriate comments to students.\n– I’m terrified that I am a predator now, re: #1 above. My guess: talking to girls about the “innit” meme and using the word “sexual” to describe what I thought it wasn’t. or saying that I'm queer.	\N	2025-12-01 01:28:49.249+00
28	2	The EI means emotional impaired--a catchall for neurodivergence behavioral problems I'm guessing.\n\nThey use a point system to incentivize the kids to behave better.\n\nThe teacher is here most of today, making my gig partly a mistake, but we talked about their program vs Sparta's ASD program that's in its first year, and how many of them are intended to be for all (north) Kent County. So maybe I can get a Kent ISD consulting-like job?\n\nfor this gig, and ones like it, maybe I can offer rationale to students when they're confused? and/or document management for the staff (related to the IS Manager job I'm trying to get).\n\nthe teacher prefers I go by Mr. Stark rather than Bob -- makes sense given the culture of the classroom. also she's been "doing this" for like 30 years, meaning either training kids to be normal or maybe something more technical.\n\nthe TAs are engaging with/managing the kids, and the teacher did attendance for the day. so I have no work.\n\nI feel like crying as I think about EI, ASD, and student behaviors in normal classes I sub for, the lack of explicit ADHD/undiagnosed student support -- partly because the former programs teach masking and the normal classes expect neurotypicality.\n\nI scanned their SCEI standards document to meditate on more later, but the biggest red flag is their rationale: getting the kids to be more productive. it reminds me of the Rockefeller quote about public schools existing to create better workers (vs good citizens/etc). also to follow orders better. nothing about the point system being used to help them plan, set goals, and persevere to achieve them (i.e., empowering them to learn about themselves).\n\nideally they'd have a neuro-affirming system that helps kids identify their strengths as well as challenges (even if they are neurotypical, there should be reasons/rationale). like I'm trying to support with Datagotchi.\n\ntbf, the doc does mention confidence and motivation. so maybe the issue is a lack of neuro-psych (-iatry) knowledge to empower the kids, collaborate with them.\n\nmy crying feeling is probably due to my CPTSD/lack of trust. unclear how right I am or not vs other people's... desire to be included/in society.\n\none of the students had a tantrum of sorts, so they put him in the Quiet Room until he settled down. 	\N	2025-12-15 15:10:56.11+00
16	2	subbing for  1st hour, English 10 (otherwise prep hour), at the request of office admin (aw) and it was easy, they just had to read another book chapter.\n\n\n2nd/3rd/4th hours (English 9): also easy since they just had a single assignment on paper that I handed out, and they are high-schoolers (vs ms).\n\n\nWIN was fine. then I brought purple carrot for lunch (yay, yum, healthy, extra calories vs a pbj) into the staff lounge and Brooklyn says hi and wishes me a great day. so I guess she's not upset with me like I envisioned! slightly flirty even? 9th graders said she's dating another teacher here, "darn." and apparently she's in her 20s, yikes. and I saw her later and it was maybe a different person than during lunch (skinnier, younger maybe).\n\n\nWhoops, I tried to make a joke again (one crinkled another's paper, the other said I'll crinkle you, so I said you reply with I'll crinkle your mom, to which they freaked out, so I guess that didn't age well). Gotta stop that!\n– I think it was Ms Heiss at lunch, though the website pictures dont give Brooklyn credit vs what I saw earlier today / and Ms Anys might be who I saw in the ms staff lounge before\n\nmy biggest learning has been about finding a middle ground between being a responsible adult and not being like adults who have mistreated me my entire life. that means at least no tiktok memes because I don't know their full & changing meanings, and move kids back to their assigned seats or otherwise away from their social group if they won't quiet down. many things in between are still unclear -- so maybe bus driving is better: some socializing and some discipline, but presumably less of each, meaning more like training wheels/easier for me\n– my main problem isn't socializing (with boundaries now) or disciplining (though I'm more liberal than I should be), but "brain vomit"/stream of consciousness/tmi mistakes. I wonder why?\n	\N	2025-12-01 00:40:14.422+00
26	2	same teacher as Tuesday the 9th, so I expected a relaxing day.\n\nlearned that the teacher I'm subbing for, who makes a bunch of mistakes, is a coach! sigh, that explains so much.\n\nundiagnosed ADHD (or w/e) kids are a problem, so I put them together to watch an educational YT video. separated the others who are working on the homework quietly into the hallway.\n\nteacher came back for 2nd/last class, said hi/shook my hand/etc., and asked if everything went ok. I said some students struggled to focus in the 1st class, but we found a solution. he said a student in the last class on Tuesday said something went wrong but didn't say what. I thought back to Tuesday but couldn't think of anything.\n\nI'm at a local restaurant while my parents finish what they were doing to pick me up and am panicking about getting banned again. Suzanne offered a bunch of ideas (without calming me, as per usual) but I either tried all of them or can't. one new idea: check in with the students more.	\N	2025-12-11 12:34:56.31+00
25	2	kids who need extra support it seems.\n\n1st hour: gave a test and working on Datagotchi Fieldnotes. one kid threw up blood in the bathroom 🙁 so I told him to go to the office so they can call his parents.	\N	2025-12-09 12:18:27.519+00
27	2	I love subbing here because the students have experienced tough things in life, many are trans and/or neurodivergent, though most are high-school age so remember to be a responsible adult still.\n\nhelped sub admin (susan) get attendance without canonical documents.\n\n3rd hour: asked round table of students to be quiet so we don't get in trouble, or go to normal seats.\n\nRAM time: unclear if I need to take attendance.\n\n5th hour was cut short to play volleyball with a beach ball again. I was invited so I joined and had fun, strengthened connections hopefully.	\N	2025-12-12 12:33:48.157+00
19	2	1st Hour (AP Lang): Quiet, productive atmosphere established after brief instruction on noise levels. \n\n2nd Hour (English 12): Louder but uneventful. \n\n3rd Hour ("Intervention" during lunches): 2h 20m of low productivity; students felt like they couldn't get help from me because I'm a sub. \n\n4th Hour ("Focus"): Teacher requested move; I took them to another teacher. \n\nOffice Interaction: Office staff/Focus teacher seemed angry when I asked if I could assist elsewhere after delegating the student.\n\n-- made a joke in the last hour about a dance party when the teacher left briefly and got mixed reactions. another sarcasm failure	\N	2025-12-01 01:29:10.795+00
24	2	very relaxing bc the students all work on their computers while I work on Datagotchi stuff on my laptop\n\nchatted with a couple of students during my prep hour about how west Michigan is inexplicably worse (conservative) than when I was a kid! and another briefly who I met last time saying I'm the GOAT (sub) <3 bc I treat my students like actual humans\n\nI wish I could teach ft here, but they have no money\n\nlearned one student who I met last time is autistic, so I tried bonding with them over alexithymia and asking why to neurotypicals. and accidentally brought up these challenges with those things in a group that was about acting normally (vs many of them having behavioral problems), in preparation for a trip to grcc tomorrow apparently.\n\nlearned that most of these students are hs level/teenagers, so not "adult education" per se.\n\nmultiple autists and trans folx. but most (others) are focused on fighting and other crimes --> emotional management problems	\N	2025-12-08 12:44:04.454+00
23	2	all day with the same 5 kids, 4 TAs that engage with individual kids. I'm mostly delivering attendance document copies every hour.\n\nShowing the Magic School Bus mostly, which is fantastic because it's all about sensemaking! The Arthur xmas movie less so, but still educational. \n\nGiving a kid popcorn -- "what do we say?" / thanks, so still doing cultural conditioning, too.\n\nI complimented the TAs at the end of the day, one asked me about my side project, so I explained Fieldnotes (maybe to get them interested in using it?), including the first 3 alpha users -- including Heidi for ICE incidents, whoops (conservative area).\n\nFor ADHD kids, they have floating TAs that support them. I'm not sure what the process for this is, and I've experienced undiagnosed kids without TA support, so it's not ideal for supporting sensemaking of all kids & staff.\n\n--\n\nAnalyzing Datagotchi affective-neurofututistic sensemaking (ANS) & Fieldnotes methodology vs Sparta MS disciplining processes (and the ASD room's variant of it) to ideally support undiagnosed neurodivergent students more uniformly.\n\nANS for the Datagotchi vision of neurfuturistic/broad neurodiversity sensemaking support: trigger/event > capture feelings > construct model of event > apply model\n\nFieldnotes for in situ event handlers (substitute teacher, therapist, community organizer): event > think > act > log > revisit log later for sensemaking \n\nSparta MS discipline for presumed neurotypical kids: event > what are you doing? > what are the expectations? > what will happen if you continue? > are you willing to work with me? > event again > what are you doing? > what did we agree would happen? > where do you need to go now? (office/RTC room)\n\nObserved processes in ASD room by TAs:\n\nminor event (loud, running) > speaking calmly, ask them to quiet/slow down > with  reasons sometimes/ideally (e.g., "you'll hurt yourself")\n\nbigger event > threaten to send to sensory room, ask them why they are upset/doing something, offer to contact parents, sit to be at their level, talk quietly, stay calm > remove other kids from room > send kid to sensory room, take a walk \n\nASD room crisis response plan: serious event (leaving room, yelling, misbehaving in hallway/public) > send to group text > call in reinforcements, get students out of the room ASAP, quarantine them > tell principal \n\nSynthesis: inconsistent handling -- threatening to send to sensory room, not giving reasons for requests/demands. a shared plan would be helpful.\n\nIdea: event > think, identify relevant plan part(s) > act based on plan (if possible/appropriate) > log > send to someone else/individually revisit log later > update plan	\N	2025-12-05 13:55:29.076+00
15	2	I got called uncle fester (bc of my difficult life eye darkness) by the same kid who did it before, upsetting me, but now I'm excited to be working on the Datagotchi neurodivergent tools (while subbing) instead!\n\nThe next class is louder, but I used the word "warning" and they quieted down.\n\nI had a "brain fart" (ADHD?) in WIN class and mistakenly asked them to read for 15 minutes (other class directions), but was corrected by a student.\n\nThe teacher I'm subbing for asked a student to write page numbers of answers to the reading comprehension assignment, and an announcement came on about skipping a drama performance for a football game. So, Kent City schools are trash!\n\nIn last hs class, stopped writing down bathroom breaks because I'm tired/annoyed and I'm not sure if I wanted to do so originally.\n\nIn the ms classes, I got lots of high fives and other positive things for those who remembered me subbing for them before, so that was nice. curt gerbers, the principal, attended my first class maybe because he doesn't trust me, and maybe because of my mistakes on Monday the 17th, or maybe just because that's the kind of thing he does. after he left the first class everyone started misbehaving a lot, some told me that the kids from yesterday in Sparta shared tiktok(s) from when I didn't enforce the no cell phone rule (even though I asked them to delete them because it's evidence), and several started grilling me for what other teacher I have a crush on. I tried to keep it a secret while giving hints to give them a mental challenge, and as an award for finishing their assignment, which worked a little bit but not as well as I was hoping. and I confided in a couple of kids I made stronger connections with, and gave another hint that was probably too much (tje first letter of one of their names was B) that one kid guessed correctly (it was her first name) so I responded with a "shhh!" finger gesture, so he's a third kid who knows -- though at least to one of the classes I also confided in them that I'm aroace so I'm not interested in hitting on her. so tomorrow I'll find out if they shared it with others (e.g., on tiktok again) and if it will cause this teacher to approach me tomorrow (when I'm subbing for the same teacher, part at hs and part at ms), to which I'll explain somehow that I had to choose a teacher to fuel the guessing game -- even though she is someone I felt attraction for at some point, but have never intended to approach.	\N	2025-12-01 00:38:29.607+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password) FROM stdin;
2	bob@datagotchi.net	$2b$10$grxJXu0y.zepdSntX1uB1.CRmX9d/qLFC8riii3gveeUwMP6rRoYm
\.


--
-- Name: field_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.field_values_id_seq', 62, true);


--
-- Name: fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fields_id_seq', 7, true);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notes_id_seq', 28, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: field_values field_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_values
    ADD CONSTRAINT field_values_pkey PRIMARY KEY (id);


--
-- Name: fields fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users u_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT u_email UNIQUE (email);


--
-- Name: field_values u_fid_nid; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_values
    ADD CONSTRAINT u_fid_nid UNIQUE (field_id, note_id);


--
-- Name: fields u_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fields
    ADD CONSTRAINT u_name UNIQUE (name);


--
-- Name: sessions u_uid_t; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT u_uid_t UNIQUE (user_id, token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: field_values fk_fid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_values
    ADD CONSTRAINT fk_fid FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE CASCADE;


--
-- Name: field_values fk_nid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_values
    ADD CONSTRAINT fk_nid FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;


--
-- Name: sessions fk_uid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_uid FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

