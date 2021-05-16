Poll is an Altspace MRE app for taking quick polls. Hosts asks questions and people
can respond in real-time. Great for breaking the ice at meetups or surveying the team
at meetings.

TODO: add demo world

# Usage

## Spawning the App

You can also place it manually using:

> wss://mankindforward-poll.herokuapp.com

## Hosting

![Hosting Screenshot](https://github.com/tuesy/poll/blob/main/hosting.png?raw=true)

Only hosts see an orange "Poll" button at the bottom right of the screen. When you click it,
you can enter a question to start a poll. For example:

> "Are we in a simulation?"

The app will automatically format your question by capitalizing the first letter and adding a
question mark at the end if there isn't one. This makes polling easier and faster. For example:

> "are we in a simulation"

```
Are we in a simulation?
1. Yes
2. No
```

When you click "OK" after entering the question, you start a poll. Users will hear a sound and
see two choices by default, "Yes" and "No", that they can vote on. Once the first vote is submitted
the screen will show live poll results. Users can change their vote at any time and vote as
often as they'd like--each user has a single vote. When you click the Poll button again and enter
another question, a new poll will start.

## Custom Choices

Hosts can customize the choices beyond "Yes" and "No". You can specify up to *6* choices by
appending them to the end of the question separated by the "|" character. For example:

> "how many fingers am I holding up|one|two|three|four"

```
How many fingers am I holding up?
1. One
2. Two
3. Three
4. Four
```

## Backgrounds

By default, the app will randomly select a background but you can specify one:

> wss://mankindforward-poll.herokuapp.com?bg=1

1. ![Background Tile 1](https://github.com/tuesy/poll/blob/main/public/tile01.png?raw=true)
2. ![Background Tile 2](https://github.com/tuesy/poll/blob/main/public/tile02.png?raw=true)
3. ![Background Tile 3](https://github.com/tuesy/poll/blob/main/public/tile03.png?raw=true)
4. ![Background Tile 4](https://github.com/tuesy/poll/blob/main/public/tile04.png?raw=true)
5. ![Background Tile 5](https://github.com/tuesy/poll/blob/main/public/tile05.png?raw=true)
6. ![Background Tile 6](https://github.com/tuesy/poll/blob/main/public/tile06.png?raw=true)
7. ![Background Tile 7](https://github.com/tuesy/poll/blob/main/public/tile07.png?raw=true)
8. ![Background Tile 8](https://github.com/tuesy/poll/blob/main/public/tile08.png?raw=true)
9. ![Background Tile 9](https://github.com/tuesy/poll/blob/main/public/tile09.png?raw=true)


# Development
* Fork this repo
* Create a Heroku app and link it to your github repo
* Enable auto deploys from github
* In Altspace:
  * Open World Editor > Altspace > Basics > SDK App
  * `ws://<your subdomain>.herokuapp.com` (port 80)
  * Click Confirm
