# generate polls from opentdb.com
# https://opentdb.com/api.php?amount=15&category=9&type=multiple

# {
#   "favorites": [
#     {
#       "name": "What is JimmyPoll?",
#       "choices": [
#         "Bitterly cold city in Siberia",
#         "Awesome Altspace app",
#         "Son of JimmyCam",
#         "Learn more at github.com/tuesy/poll"
#       ]
#     },
#     ...
#   ]
# }

# Usage: ruby opentdb.rb 9
# => trivia.json

DEBUG = false

p ARGV if DEBUG

require 'faraday'
require 'json'

category = ARGV[0]
filename = 'trivia.json'
amount = 15
uri = "https://opentdb.com/api.php?amount=#{amount}&category=#{category}&type=multiple"
response = Faraday.get uri
json = JSON.parse(response.body)


polls = []

json['results'].each do |x|
  poll = {
    name: x['question'],
    choices: x['incorrect_answers'] + [x['correct_answer']],
    answer: x['correct_answer'],
    difficulty: x['difficulty'],
    category: x['category']
  }
  polls << poll
end

p json if DEBUG

data = {
  favorites: polls
}

File.open(filename, 'w') do |f|
  f.write JSON.pretty_generate(data) # so it's more readable
end

system("cat #{filename}")