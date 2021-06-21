FROM python:3.8.5-alpine3.11

WORKDIR /home/app
COPY ./requirements.txt /home/app/
RUN pip install -U pip setuptools flask pandas sklearn
#RUN pip install -r requirements.txt
COPY . ./
CMD ["python", "app.py"]