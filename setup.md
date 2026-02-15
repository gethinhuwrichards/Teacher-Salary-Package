# Background

Teacher salary and packages are opaque for most schools. Job adverts do not list benefits and this wastes everyone's time.

Website's purpose is to make packages and pay-scales for every school available.

# Function

Split into two parts for users. Options appear as 1) 'Submit my salary' and 2) 'View salaries'. Users should be encouraged to submit their own salary on front page. 

On first load of either page users enter their preferred currency usd/gbp or euro. currencies are then always shown in local currency (for that school and the preferred). users can change later from menu on top right but do not ask for this again after first visit.

1) Submissions: 
- Teachers submit their salary and package at their present school. 
- Submissions are anonymised but dated.
- Data required:
	- School - Select from list. Type into textbox and after first word drop down lists of matching schools appear (with country of school afterwards). List of schools provided in international_schools_list.txt (will need to create database of these school names and store with country and aliases for each school).  Normalize query and names (lowercase, strip punctuation, collapse whitespace, expand common tokens like int->international).  If their school not there user can click enter their school as text in the box but must select checkbox (checkbox says something like I have checked and can confirm my school is not in the list).  New schools are added to this list after review.
	- Position - Select from list. Options are classroom teacher, teacher with additional responsibilities, middle leader, senior leader - other, and senior leader - head.
	- Gross pay per annum.  Type into textbox. Also dropdown to select currency from local currency of that country or in dollar/gbp/euro. Will need to build list of country=local currency to ensure that only these four options are available.
	- Accommodation either allowance (same currency options), provided (furnished/unfurnished) or not provided.
- Additional data (accept blank submission): 
	- Estimated net pay per annum after taxes.  (same currency options as gross). Can click box if tax not applicable and then don't need to enter.
	- Pension (yes/no) plus amount in %.
	- Places for children (0, 1, 2 or more) or discount, then they have free text entry.
	- Comprehensive medical insurance included (yes/no) plus details box for text entry.
- Currencies are entered in local currency (that salary is paid in) and converted to Dollars/GBP/Euros (at time of submission). Can cache daily rates in a table to avoid repeated calls.
- Must create database of all submitted information. You can use supabase for the submission data. Could have separate database on supabase for school list (country currency aliases etc), it depends what you decide is best.
- Submissions must go to review after submission before they appear on the site.

2) Package information
- Users can view submissions.
- User navigate schools which are organised by country (drop down for country with list of available schools).
- Only show schools which have submissions.
- Also search function to bring up submitted schools.
- After clicking school show new page and where submissions for each school are shown. 
- At top of page show average annual gross for teachers excluding senior leadership. This is the headline. Should be shown in local currency and usd/euro/gbp.
- Individual submission are shown below. Should be organised by position from teachers up to senior leader - head.  

In addition need moderator/admin review page.
- Show individual submissions in full - list all info including local currency and conversion (admin have same currency options in menu). 
- Option to accept or deny. 
	- Accepted schools become viewable in package information.
	- Denied options stay in database and are archived. Separate button on admin review to see archived options. these can then be 'restored' with another button and put back in review cue.
- Highlight new schools submission in red. If these are accepted add school to list. Also give option to revise school where admin can search list and try and match school to existing. 
- password protect admin site and give separate page address.


# UI

- Make clean as possible - use bright colours. 
- Inspiration in design inspo .webp file.