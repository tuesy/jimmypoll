# Overview

JimmyPoll is an Altspace app for running polls. Hosts ask questions and people vote in real-time. Great for breaking the ice at meetups, surveying the team at meetings or even playing a trivia game. It's easy to put up a question on-the-fly or preload a set questions.

There's a demo Altspace world here: https://account.altvr.com/worlds/1046572460192825569/spaces/1741224889605423539

# Quickstart

Try it out with a sample poll:

```
wss://mankindforward-poll.herokuapp.com?poll=quickstart
```

Once the app launches, click on the heart button to load the poll. Browse the "polls" folder more polls and change a parameter `?poll=<name>` to preload it.

| Name            | Category   | Description                               |
| ----------      | ---------- | ----------                                |
| quickstart      | tutorial   | show you the ropes                        |
| trivia-general  | trivia     | general knowledge trivia from opentdb.com |
| trivia-altspace | trivia     | trivia about Altspace itself              |


# Usage

## Spawning the App

You can place it manually using:

```
wss://mankindforward-poll.herokuapp.com
```

## Hosting

![Hosting Screenshot](https://github.com/tuesy/poll/blob/main/hosting.png?raw=true)

Only hosts see an orange "Poll" button at the bottom right of the screen. When you click it, you can enter a question to start a poll. The app will automatically format your question by capitalizing the first letter and adding a question mark at the end if there isn't one. This makes polling easier and faster. For example:

```
are we in a simulation
```

> Are we in a simulation?
> 1. Yes
> 2. No

When you click "OK" after entering the question, you start a poll. Users will hear a sound and see two choices by default, "Yes" and "No", that they can vote on. Once the first vote is submitted the screen will show live results. Users can change their vote at any time but each user has a single vote. When you click the Poll button again and enter another question, a new poll will start.

## Custom Answers

Hosts can customize the answers beyond "Yes" and "No". You can specify up to *6* by appending them to the end of the question separated by the "|" character. For example:

```
how many fingers am I holding up|one|two|three|four
```

> How many fingers am I holding up?
> 1. One
> 2. Two
> 3. Three
> 4. Four

## Backgrounds

By default, the app will randomly select a background but you can specify one:

![Background Tile 1](https://github.com/tuesy/poll/blob/main/public/tile01.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=1
```

![Background Tile 2](https://github.com/tuesy/poll/blob/main/public/tile02.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=2
```

![Background Tile 3](https://github.com/tuesy/poll/blob/main/public/tile03.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=3
```

![Background Tile 4](https://github.com/tuesy/poll/blob/main/public/tile04.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=4
```

![Background Tile 5](https://github.com/tuesy/poll/blob/main/public/tile05.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=5
```

![Background Tile 6](https://github.com/tuesy/poll/blob/main/public/tile06.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=6
```

![Background Tile 7](https://github.com/tuesy/poll/blob/main/public/tile07.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=7
```

![Background Tile 8](https://github.com/tuesy/poll/blob/main/public/tile08.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=8
```

![Background Tile 9](https://github.com/tuesy/poll/blob/main/public/tile09.png?raw=true)
```
wss://mankindforward-poll.herokuapp.com?bg=9
```

## Background Brightness

The screen's brightness depends on the lighting in your World or Event. If you have a directional light, just rotating the app may change the brightness. You can adjust it by setting a parameter:

```
wss://mankindforward-poll.herokuapp.com?brt=0.5
```

The default is *0.3* and *1.0* is the brightest. If it's still too bright at *0.1*, you can't set it to *0* but you can set a really small value like *0.01*.

## Favorites

![Favorites feature screenshot](https://github.com/tuesy/poll/blob/main/favorites.png?raw=true)

You can preload polls with the Favorites feature by specifying a Content Pack:

```
wss://mankindforward-poll.herokuapp.com?content_pack=1739750885568807748
```

To create your own, start by navigating to http://account.altvr.com/content_packs/new. Give it a name and fill in the "Content" field with your own polls in this format:

```javascript
{
  "favorites": [
    {
      "name": "Poll 1",
      "choices": [
        "one",
        "two"
      ]
    },
    {
      "name": "Poll 2",
      "choices": [
        "one",
        "two",
        "three"
      ]
    }
  ]
}
```

Click "Create" and then click "Copy to Clipboard" next to the ID. This is the value you'll need for the "content_pack" parameter:

> ...?content_pack=\<your-id-here\>

Try an Altspace survey:

```
wss://mankindforward-poll.herokuapp.com?content_pack=1739835756899205385
```

https://account.altvr.com/content_packs/1739835756899205385

```javascript
{
  "favorites": [
    {
      "name": "How long have you been using AltspaceVR?",
      "choices": [
        "1-3 months",
        "3-6 months",
        "6 months - 1 year",
        "1-3 years",
        "3+ years"
      ]
    },
    {
      "name": "How often do you use AltspaceVR?",
      "choices": [
        "Infrequently",
        "Monthly",
        "Weekly",
        "Daily"
      ]
    },
    {
      "name": "Have you been to at least 2 events in the past 2 weeks?",
      "choices": [
        "Yes",
        "No"
      ]
    },
    {
      "name": "How would you feel if you could no longer use AltspaceVR?",
      "choices": [
        "Very disappointed",
        "Somewhat disappointed",
        "Not disappointed"
      ]
    }
  ]
}
```

# Development
* Fork this repo
* Create a Heroku app and link it to your github repo
* Enable auto deploys from github
* In Altspace:
  * Open World Editor > Altspace > Basics > SDK App
  * `ws://<your subdomain>.herokuapp.com` (port 80)
  * Click Confirm
